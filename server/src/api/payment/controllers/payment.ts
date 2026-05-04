import { triggerAllPaymentsManually } from "../../../../queue/workflow";

const PAYMENT_API = "api::payment.payment";

async function verifyAdminAuth(ctx): Promise<boolean> {
  const { authorization } = ctx.request.header;
  if (!authorization) return false;

  const parts = authorization.split(/\s+/);
  if (parts[0].toLowerCase() !== 'bearer' || parts.length !== 2) return false;

  const token = parts[1];
  const manager = (strapi as any).sessionManager;
  if (!manager) return false;

  const result = manager('admin').validateAccessToken(token);
  if (!result.isValid) return false;

  const isActive = await manager('admin').isSessionActive(result.payload.sessionId);
  if (!isActive) return false;

  const user = await strapi.db.query('admin::user').findOne({
    where: { id: result.payload.userId },
    populate: ['roles'],
  });

  return !!(user && user.isActive);
}

export default {
  initPayment: async (ctx, next) => {
    const {
      amount,
      projectDocumentId,
      projectSlug,
      currencyCode = process.env.CURRENCY_AM,
      lang = "am",
      paymentMethod = "ameriabank",
      email,
    } = ctx.request.body;

    if (!amount || !projectDocumentId || !email) {
      return ctx.send(
        { error: "email, amount and projectDocumentId fields are required" },
        400
      );
    }

    const service = strapi.service(PAYMENT_API);

    const project = await strapi.documents('api::project.project').findOne({
      documentId: projectDocumentId,
      fields: ['name'],
    });

    const orderId = await service.getOrderId();
    if (!orderId) {
      return ctx.send({ errorMessage: "Failed to get latest orderId" }, 500);
    }

    const { url, errorMessage } = await service.getPaymentUrl({
      amount,
      projectDocumentId,
      projectSlug,
      projectName: project?.name,
      currencyCode,
      paymentMethod,
      lang,
      orderId,
      email,
    });

    if (errorMessage) {
      return ctx.send({ errorMessage }, 500);
    }

    return ctx.send({ url }, 200);
  },
  getPaymentDetails: async (ctx, next) => {
    const service = strapi.service(PAYMENT_API);

    try {
      const { paymentId, projectDocumentId } = ctx.request.body;
      const user = ctx.state.user;

      if (!paymentId || !projectDocumentId) {
        return ctx.send(
          { error: "paymentId and projectDocumentID fields are required" },
          400
        );
      }

      if (!user) {
        return ctx.send(
          { error: "User not authenticated" },
          401
        );
      }

      // Fetch full user data to get documentId
      const fullUser = await strapi.documents('plugin::users-permissions.user').findOne({
        documentId: user.documentId,
        fields: ['id', 'documentId'],
      });

      if (!fullUser || !fullUser.documentId) {
        return ctx.send(
          { error: "User data incomplete" },
          500
        );
      }

      // Advisory lock per paymentId prevents concurrent double-saves from the same redirect
      const trx = await strapi.db.connection.transaction();
      try {
        await trx.raw('SELECT pg_advisory_xact_lock(hashtext(?))', [paymentId]);

        const existing = await trx('payment_logs')
          .where({ payment_id: paymentId, success: true })
          .first();

        if (existing) {
          await trx.commit();
          const paymentDetails = await service.getPaymentDetails(paymentId);
          return ctx.send({ success: true, amount: paymentDetails?.Amount }, 200);
        }

        const paymentDetails = await service.getPaymentDetails(paymentId);
        if (!paymentDetails.PaymentID) {
          paymentDetails.PaymentID = paymentId;
        }

        await service.savePayment({
          paymentDetails,
          projectDocumentId,
          userId: user.id,
          userDocumentId: fullUser.documentId,
        });

        await trx.commit();

        return ctx.send({ success: true, amount: paymentDetails.Amount }, 200);
      } catch (txError) {
        await trx.rollback();
        throw txError;
      }
    } catch (error) {
      console.error("ERROR in getPaymentDetails:", error);
      return ctx.send({ errorMessage: error.message }, 500);
    }
  },
  doRecurringPayment: async (ctx, next) => {
    const { projectPaymentId } = ctx.request.body;
    const service = strapi.service(PAYMENT_API);

    try {
      // Check admin API key (for Hatchet internal calls and manual admin triggers)
      const apiKey = ctx.request.headers['x-admin-api-key'];
      if (apiKey !== process.env.ADMIN_API_KEY) {
        return ctx.unauthorized('Invalid admin API key');
      }

      const projectPayment = await service.getProjectPaymentWithMethod(projectPaymentId);

      if (!projectPayment.project) {
        throw new Error("No project found");
      }

      if (projectPayment.project.donationType !== "recurring") {
        throw new Error("Project donation type is not recurring");
      }

      await service.updateProjectPaymentIsPaymentInProgress(projectPaymentId, true);

      const orderId = await service.getOrderId();
      if (!orderId) {
        throw new Error("Failed to get latest orderId");
      }

      const bindingParams = typeof projectPayment.payment_method.params === 'string'
        ? JSON.parse(projectPayment.payment_method.params)
        : projectPayment.payment_method.params;

      // Atomically acquire lock, check if already processed, charge bank, and create log
      // CRITICAL: The bank charge happens WITHIN the lock to prevent concurrent double-charges
      const result = await service.doRecurringPaymentWithAtomicLock({
        projectPaymentId,
        projectPaymentData: {
          amount: projectPayment.amount,
          CardHolderID: bindingParams.CardHolderID,
          currency: projectPayment.currency,
          userDocumentId: projectPayment.payment_method?.userDocumentId,
          projectDocumentId: projectPayment.project.documentId,
          projectSlug: projectPayment.project.slug,
          projectName: projectPayment.project.name,
        },
        orderId,
      });

      await service.updateProjectPaymentIsPaymentInProgress(projectPaymentId, false);

      if (result.alreadyProcessed) {
        return ctx.send(
          { message: "The payment was already processed this month" },
          203
        );
      }

      // If payment failed, return error with details
      if (!result.isSuccess) {
        return ctx.send(
          {
            errorMessage: `Payment failed: ${result.paymentDetails.Description || 'Unknown error'}`,
            responseCode: result.paymentDetails.ResponseCode,
          },
          400
        );
      }

      return ctx.send(
        {
          message: "Payment was successfully processed",
        },
        200
      );
    } catch (error) {
      console.error("[PAYMENT_ERROR]", error);
      try {
        await service.updateProjectPaymentIsPaymentInProgress(projectPaymentId, false);
      } catch (e) {
        console.error("Failed to update payment in progress flag:", e);
      }
      return ctx.send({ errorMessage: error.message }, 500);
    }
  },
  triggerAllPayments: async (ctx) => {
    // Check admin API key (for manual admin triggers)
    const apiKey = ctx.request.headers['x-admin-api-key'];
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return ctx.unauthorized('Invalid admin API key');
    }

    const { projectDocumentId } = ctx.request.body;
    await triggerAllPaymentsManually(projectDocumentId);
    return ctx.send({ message: "Processing" }, 200);
  },

  // Pay with saved card (binding payment)
  payWithSavedCard: async (ctx) => {
    const { amount, projectDocumentId, paymentMethodId } = ctx.request.body;
    const service = strapi.service(PAYMENT_API);

    // Check if user is authenticated
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You must be logged in to make a payment');
    }

    if (!amount || !projectDocumentId || !paymentMethodId) {
      return ctx.send(
        { error: "amount, projectDocumentId, and paymentMethodId are required" },
        400
      );
    }

    try {
      // Get payment method details - ONLY if user owns it (database-level security)
      const paymentMethod = await strapi.documents('api::payment-method.payment-method').findOne({
        documentId: paymentMethodId,
        filters: {
          userDocumentId: user.documentId,
        },
      });

      if (!paymentMethod) {
        return ctx.forbidden('Payment method not found or access denied');
      }

      // Parse payment method params
      const params = typeof paymentMethod.params === 'string'
        ? JSON.parse(paymentMethod.params)
        : paymentMethod.params;

      // Get project data for slug
      const project = await strapi.documents('api::project.project').findOne({
        documentId: projectDocumentId,
        fields: ['slug'],
      });

      if (!project) {
        return ctx.send({ error: "Project not found" }, 404);
      }

      // Get new order ID
      const orderId = await service.getOrderId();

      // Make binding payment via Ameriabank
      const paymentDetails = await service.makeBindingPayment({
        projectPayment: {
          Amount: amount,
          CardHolderID: params.CardHolderID,
          currency: process.env.CURRENCY_AM,
        },
        orderId,
        projectDocumentId,
        projectSlug: project.slug,
      });

      // Check if payment was successful
      if (paymentDetails.ResponseCode !== process.env.SUCCESS_RESPONSE_CODE) {
        console.error("MakeBindingPayment failed:", JSON.stringify(paymentDetails, null, 2));
        return ctx.send({
          error: "Payment failed",
          details: paymentDetails.Description || "Unknown error"
        }, 400);
      }

      // Fetch full user data to get documentId
      const fullUser = await strapi.documents('plugin::users-permissions.user').findOne({
        documentId: user.documentId,
        fields: ['id', 'documentId'],
      });

      // Save payment with existing payment method ID
      await service.savePayment({
        paymentDetails,
        projectDocumentId,
        userId: user.id,
        userDocumentId: fullUser.documentId,
        existingPaymentMethodId: paymentMethodId
      });

      return ctx.send({
        success: true,
        amount: paymentDetails.Amount
      }, 200);

    } catch (error) {
      console.error("ERROR in payWithSavedCard:", error);
      return ctx.send({
        error: "Payment processing failed",
        details: error.message
      }, 500);
    }
  },
  cancelPayment: async (ctx) => {
    if (!await verifyAdminAuth(ctx)) {
      return ctx.unauthorized('Invalid admin token');
    }

    const { paymentLogDocumentId } = ctx.request.body;
    const service = strapi.service(PAYMENT_API);

    if (!paymentLogDocumentId) {
      return ctx.send({ error: "paymentLogDocumentId is required" }, 400);
    }

    try {
      const log = await strapi.documents('api::payment-log.payment-log').findOne({
        documentId: paymentLogDocumentId,
      });

      if (!log) {
        return ctx.send({ error: "Payment log not found" }, 404);
      }

      if (!log.success || log.paymentStatus === 'cancelled' || log.paymentStatus === 'refunded') {
        return ctx.send({ error: "Payment is not eligible for cancellation" }, 400);
      }

      const hoursElapsed = (Date.now() - new Date(log.createdAt).getTime()) / (1000 * 60 * 60);
      if (hoursElapsed > 72) {
        return ctx.send({ error: "Cancel window expired (72 hours). Use refund instead." }, 400);
      }

      const paymentId = log.paymentId;
      if (!paymentId) {
        return ctx.send({ error: "No PaymentID found for this log" }, 400);
      }

      // Optimistic lock: atomically claim the cancel slot before calling the bank
      const claimed = await strapi.db.connection.raw(
        `UPDATE payment_logs SET payment_status = 'cancelling'
         WHERE document_id = ? AND payment_status NOT IN ('cancelled','refunded','cancelling')
         RETURNING id`,
        [paymentLogDocumentId]
      );
      if (!claimed.rows.length) {
        return ctx.send({ error: "Already cancelled or concurrent cancel in progress" }, 409);
      }

      const result = await service.cancelPayment(paymentId);

      if (result.ResponseCode !== process.env.SUCCESS_RESPONSE_CODE) {
        // Roll back the optimistic claim so retries are possible
        await strapi.db.connection.raw(
          `UPDATE payment_logs SET payment_status = 'completed' WHERE document_id = ?`,
          [paymentLogDocumentId]
        );
        return ctx.send({
          error: "Cancel failed",
          details: result.ResponseMessage || result.ResponseCode,
        }, 400);
      }

      await strapi.documents('api::payment-log.payment-log').update({
        documentId: paymentLogDocumentId,
        data: {
          paymentStatus: 'cancelled',
          success: false,
          refundedAmount: log.amount,
        } as any,
      });

      return ctx.send({ success: true, message: "Payment cancelled successfully" }, 200);
    } catch (error) {
      console.error("ERROR in cancelPayment:", error);
      return ctx.send({ error: "Cancel failed", details: error.message }, 500);
    }
  },
  refundPayment: async (ctx) => {
    if (!await verifyAdminAuth(ctx)) {
      return ctx.unauthorized('Invalid admin token');
    }

    const { paymentLogDocumentId, amount } = ctx.request.body;
    const service = strapi.service(PAYMENT_API);

    if (!paymentLogDocumentId || !amount) {
      return ctx.send({ error: "paymentLogDocumentId and amount are required" }, 400);
    }

    try {
      const log = await strapi.documents('api::payment-log.payment-log').findOne({
        documentId: paymentLogDocumentId,
      });

      if (!log) {
        return ctx.send({ error: "Payment log not found" }, 404);
      }

      if (!log.success && log.paymentStatus !== 'partial_refund') {
        return ctx.send({ error: "Payment is not eligible for refund" }, 400);
      }

      if (log.paymentStatus === 'cancelled' || log.paymentStatus === 'refunded') {
        return ctx.send({ error: "Payment is already cancelled/refunded" }, 400);
      }

      const paymentId = log.paymentId;
      if (!paymentId) {
        return ctx.send({ error: "No PaymentID found for this log" }, 400);
      }

      // Optimistic lock: atomically claim the refund amount before calling the bank.
      // The WHERE guard (refunded_amount + amount <= log_amount) prevents concurrent
      // requests from over-refunding even if both pass the earlier read-based check.
      const claimed = await strapi.db.connection.raw(
        `UPDATE payment_logs
         SET refunded_amount = refunded_amount + ?
         WHERE document_id = ?
           AND payment_status NOT IN ('cancelled', 'refunded')
           AND refunded_amount + ? <= amount
         RETURNING id, refunded_amount, amount`,
        [amount, paymentLogDocumentId, amount]
      );
      if (!claimed.rows.length) {
        return ctx.send({ error: "Refund amount exceeds remaining or payment already fully refunded" }, 409);
      }

      const { refunded_amount: newRefundedAmount, amount: totalAmount } = claimed.rows[0];
      const isFullRefund = newRefundedAmount >= totalAmount;

      const result = await service.refundPayment(paymentId, amount);

      if (result.ResponseCode !== process.env.SUCCESS_RESPONSE_CODE) {
        // Roll back the optimistic increment
        await strapi.db.connection.raw(
          `UPDATE payment_logs SET refunded_amount = refunded_amount - ? WHERE document_id = ?`,
          [amount, paymentLogDocumentId]
        );
        return ctx.send({
          error: "Refund failed",
          details: result.ResponseMessage || result.ResponseCode,
        }, 400);
      }

      await strapi.documents('api::payment-log.payment-log').update({
        documentId: paymentLogDocumentId,
        data: {
          paymentStatus: isFullRefund ? 'refunded' : 'partial_refund',
          success: isFullRefund ? false : log.success,
        } as any,
      });

      return ctx.send({
        success: true,
        message: isFullRefund ? "Full refund processed" : "Partial refund processed",
        refundedAmount: newRefundedAmount,
        remaining: totalAmount - newRefundedAmount,
      }, 200);
    } catch (error) {
      console.error("ERROR in refundPayment:", error);
      return ctx.send({ error: "Refund failed", details: error.message }, 500);
    }
  },
};
