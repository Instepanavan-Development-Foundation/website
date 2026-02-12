import { triggerAllPaymentsManually } from "../../../../queue/workflow";

const PAYMENT_API = "api::payment.payment";

export default {
  initPayment: async (ctx, next) => {
    const {
      amount,
      projectDocumentId, // TODO: we have donationType in db, handle it!
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

    const orderId = await service.getOrderId();
    if (!orderId) {
      return ctx.send({ errorMessage: "Failed to get latest orderId" }, 500);
    }

    const { url, errorMessage } = await service.getPaymentUrl({
      amount,
      projectDocumentId,
      projectSlug,
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

      const paymentDetails = await service.getPaymentDetails(paymentId);

      await service.savePayment({
        paymentDetails,
        projectDocumentId,
        userId: user.id,
        userDocumentId: fullUser.documentId
      });

      return ctx.send({
        success: true,
        amount: paymentDetails.Amount
      }, 200);
    } catch (error) {
      console.error("ERROR in getPaymentDetails:", error);
      await service.createPaymentLog(error.message);
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

      const projectPayment =
        await service.getProjectPaymentWithMethod(projectPaymentId);

      if (!projectPayment.project) {
        throw new Error("No project found");
      }

      if (projectPayment.project.donationType !== "recurring") {
        throw new Error("Project donation type is not recurring");
      }

      // find payment log for this month with projectPaymentId, success: true,
      const projectPaymentLogForThisMonth =
        await service.getProjectPaymentLogForThisMonth(projectPaymentId);
      if (projectPaymentLogForThisMonth) {
        return ctx.send(
          {
            message: `The payment was already processed this month`,
          },
          203
        );
      }
      // if payment is in progress, skipping the payment
      if (projectPayment.isPaymentInProgress) {
        throw Error(
          `Project Payment with projectPaymentId ${projectPaymentId}  is in progress`
        );
      }

      await service.updateProjectPaymentIsPaymentInProgress(
        projectPaymentId,
        true
      );

      const orderId = await service.getOrderId();
      if (!orderId) {
        return ctx.send({ errorMessage: "Failed to get latest orderId" }, 500);
      }

      const paymentDetails = await service.makeBindingPayment({
        projectPayment,
        orderId,
      });

      // Check if payment was actually successful
      const isSuccess = paymentDetails.ResponseCode === process.env.SUCCESS_RESPONSE_CODE;

      await service.createPaymentLog({
        paymentDetails,
        projectPaymentId,
        success: isSuccess,
      });

      await service.updateProjectPaymentIsPaymentInProgress(
        projectPaymentId,
        false
      );

      // If payment failed, return error with details
      if (!isSuccess) {
        return ctx.send(
          {
            errorMessage: `Payment failed: ${paymentDetails.Description || 'Unknown error'}`,
            responseCode: paymentDetails.ResponseCode,
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
      console.log(error);
      await service.updateProjectPaymentIsPaymentInProgress(
        projectPaymentId,
        false
      );
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
          BindingID: params.BindingID,
          currency: process.env.CURRENCY_AM,
        },
        orderId,
        projectDocumentId,
        projectSlug: project.slug,
      });

      // Check if payment was successful
      if (paymentDetails.ResponseCode !== process.env.SUCCESS_RESPONSE_CODE) {
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
};
