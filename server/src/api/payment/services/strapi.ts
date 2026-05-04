import {
  PAYMENT_LOG_API,
  PAYMENT_METHOD_API,
  PROJECT_API,
  PROJECT_PAYMENT_API,
} from "../constants/apis";
import { CURRENCIES } from "../constants/currencies";
import bankingService from "./banking";

const service = {
  savePayment: async ({ paymentDetails, projectDocumentId, projectPaymentId, userId, userDocumentId, existingPaymentMethodId }) => {
    if (paymentDetails.ResponseCode !== process.env.SUCCESS_RESPONSE_CODE) {
      throw new Error(JSON.stringify({ paymentDetails, success: false }));
    }

    let projectPaymentMethod;

    // If paying with existing payment method, reuse it instead of creating a new one
    if (existingPaymentMethodId) {
      projectPaymentMethod = await strapi.documents(PAYMENT_METHOD_API).findOne({
        documentId: existingPaymentMethodId,
      });
    } else {
      // Create new payment method only for new cards
      projectPaymentMethod =
        await service.createProjectPaymentMethod(paymentDetails, userId, userDocumentId);
    }

    if (!projectPaymentMethod) {
      throw new Error(
        "Payment method not found: " +
          JSON.stringify({
            paymentDetails,
            success: false,
          })
      );
    }

    if (!projectDocumentId) {
      // No project to link — create standalone log here
      await service.createPaymentLog({
        paymentDetails,
        projectPaymentId,
        success: true,
      });
      return;
    }

    const currentProject = await service.getProject(projectDocumentId);

    if (!currentProject) {
      throw new Error(
        `Project not found:` +
          JSON.stringify({
            paymentDetails: projectDocumentId,
            success: false,
          })
      );
    }

    // IMPORTANT: Never use fallback values (||) for payment data.
    // Missing fields must throw — silent defaults cause incorrect payment records.
    if (!currentProject.donationType) {
      throw new Error(`Project missing donationType: ${projectDocumentId}`);
    }
    if (!currentProject.name) {
      throw new Error(`Project missing name: ${projectDocumentId}`);
    }

    await service.createProjectPayment({
      paymentDetails,
      projectPaymentMethod,
      project: currentProject,
      userDocumentId,
    });

    // Use live sum from payment_logs (the authoritative source per architecture)
    // to check archive threshold — avoids both the lost-update race and the
    // gatheredAmount field that CLAUDE.md explicitly forbids using for display
    const { rows } = await strapi.db.connection.raw(
      `SELECT COALESCE(SUM(pl.amount), 0) AS total
       FROM payment_logs pl
       WHERE pl.project_document_id = ? AND pl.success = true`,
      [projectDocumentId]
    );
    const totalRaised = Number(rows[0].total);
    if (totalRaised >= currentProject.requiredAmount) {
      await service.updateProjectData({
        projectDocumentId,
        data: { isArchived: true },
      });
    }

    // Notify admin of new donation (fire-and-forget)
    service.sendDonationNotification({
      amount: paymentDetails.Amount,
      currency: paymentDetails.Currency,
      projectName: currentProject.name,
      donationType: currentProject.donationType,
      userDocumentId,
    }).catch((err) => strapi.log.error('Failed to send donation notification:', err));
  },
  createProjectPayment: async ({
    paymentDetails,
    projectPaymentMethod,
    project,
    userDocumentId,
  }) => {
    try {
      const projectPayment = await strapi
        .documents(PROJECT_PAYMENT_API)
        .create({
          data: {
            amount: paymentDetails.Amount,
            currency: paymentDetails.Currency,
            type: project.donationType,
            name: project.name,
            payment_method: projectPaymentMethod.documentId,
            project: project.documentId,
          },
        });

      // Create exactly one payment log, linked to this project payment
      await service.createPaymentLog({
        success: true,
        paymentDetails,
        projectPaymentId: projectPayment.documentId,
        userDocumentId,
        projectDocumentId: project.documentId,
        projectName: project.name,
      });

      return projectPayment;
    } catch (e) {
      console.log(
        "ERROR in createProjectPayment:",
        JSON.stringify(e, null, 2)
      );
      throw e;
    }
  },
  updateProjectData: async ({ projectDocumentId, data }) => {
    try {
      return await strapi.documents(PROJECT_API).update({
        documentId: projectDocumentId,
        data: data,
      });
    } catch (e) {
      console.log(
        "ERROR in updateProjectData:",
        JSON.stringify(e, null, 2)
      );
      throw e;
    }
  },
  createProjectPaymentMethod: async (paymentDetails: any, userId?: number, userDocumentId?: string) => {
    const { BindingID, CardNumber, CardHolderID, ExpDate } = paymentDetails;
    try {
      return await strapi.documents(PAYMENT_METHOD_API).create({
        data: {
          params: JSON.stringify({
            BindingID,
            CardNumber,
            CardHolderID,
            ExpDate,
          }),
          type: "ameriabank",
          userDocumentId: userDocumentId,
          users_permissions_user: userId,
        },
      });
    } catch (e) {
      console.log(
        "ERROR in createProjectPaymentMethod:",
        JSON.stringify(e, null, 2)
      );
      return null;
    }
  },
  // Payment logs are IMMUTABLE audit records — never delete them.
  // To void a payment, update paymentStatus ('cancelled', 'refunded') instead.
  createPaymentLog: async ({
    paymentDetails,
    success,
    projectPaymentId,
    userDocumentId,
    projectDocumentId,
    projectName,
  }: {
    paymentDetails: any;
    success: boolean;
    projectPaymentId?: string;
    userDocumentId?: string;
    projectDocumentId?: string;
    projectName?: string;
  }) => {
    try {
      const log = await strapi.documents(PAYMENT_LOG_API).create({
        data: {
          amount: paymentDetails.Amount,
          currency:
            CURRENCIES[paymentDetails.Currency ?? process.env.CURRENCY_AM],
          details: JSON.stringify(paymentDetails || {}),
          orderId: paymentDetails.OrderId,
          success: success,
          paymentId: paymentDetails.PaymentID || null,
          paymentStatus: success ? 'completed' : null,
          project_payment: projectPaymentId,
          userDocumentId: userDocumentId || null,
          projectDocumentId: projectDocumentId || null,
          projectName: projectName || null,
        },
      });

      console.log("Payment log", log);
      return log;
    } catch (e) {
      console.log(
        "something went wrong in createPaymentLog",
        JSON.stringify(e, null, 2)
      );
      return null;
    }
  },
  getProject: async (projectDocumentId: string) => {
    try {
      return await strapi.documents(PROJECT_API).findOne({
        documentId: projectDocumentId,
        status: "published",
      });
    } catch (e) {
      console.log(
        "something went wrong in getProject",
        JSON.stringify(e, null, 2)
      );

      return null;
    }
  },
  getProjectPaymentWithMethod: async (projectPaymentId: string) => {
    const projectPayment = await strapi
      .documents("api::project-payment.project-payment")
      .findOne({
        documentId: projectPaymentId,
        fields: ["amount", "currency", "isPaymentInProgress"],
        populate: {
          payment_method: {
            fields: ["params", "userDocumentId"],
          },
          project: {
            fields: ["documentId", "donationType", "name", "slug"],
          },
        },
      });

    if (!projectPayment) {
      throw new Error("No project payment");
    }

    return projectPayment;
  },
  updateProjectPaymentIsPaymentInProgress: async (
    projectPaymentId: string,
    isPaymentInProgress: boolean
  ) => {
    return await strapi.documents(PROJECT_PAYMENT_API).update({
      documentId: projectPaymentId,
      data: { isPaymentInProgress } as any,
    });
  },
  getProjectPaymentLogForThisMonth: async (projectPaymentId) => {
    // CRITICAL: Use Armenia timezone (UTC+4) for month boundary, not server local time
    const armeniaTimeStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Yerevan' });
    const currentDate = new Date(armeniaTimeStr);
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    // Use exclusive upper bound to avoid midnight off-by-one on last day of month
    const startOfNextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

    // First check: Has this payment succeeded THIS MONTH?
    const successLogs = await strapi.documents(PAYMENT_LOG_API).findMany({
      filters: {
        project_payment: { documentId: projectPaymentId },
        success: true,
        createdAt: {
          $gte: startOfMonth.toISOString(),
          $lt: startOfNextMonth.toISOString(),
        },
      },
    });

    if (successLogs.length > 0) {
      return successLogs[0];
    }

    // Second check: Has this payment FAILED THIS MONTH?
    // Scoped to current month — cross-month failures must not block a new billing period
    const recentFailedLogs = await strapi.documents(PAYMENT_LOG_API).findMany({
      filters: {
        project_payment: { documentId: projectPaymentId },
        success: false,
        createdAt: {
          $gte: startOfMonth.toISOString(),
          $lt: startOfNextMonth.toISOString(),
        },
      },
    });

    if (recentFailedLogs.length > 0) {
      return recentFailedLogs[0];
    }

    return null;
  },
  checkAndCreatePaymentLogWithLock: async (
    projectPaymentId: string,
    paymentDetails: any,
    success: boolean,
    userDocumentId?: string,
    projectDocumentId?: string,
    projectName?: string
  ) => {
    // Start a database transaction with row-level lock
    const trx = await strapi.db.connection.transaction();

    try {
      // Acquire exclusive lock on the project_payment row
      const projectPaymentRecord = await trx('project_payments')
        .where({ document_id: projectPaymentId })
        .forUpdate()
        .first();

      if (!projectPaymentRecord) {
        await trx.rollback();
        throw new Error('Project payment not found');
      }

      // CRITICAL: Use Armenia timezone (UTC+4) for month boundary, not server local time
      const armeniaTimeStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Yerevan' });
      const currentDate = new Date(armeniaTimeStr);
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const startOfNextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

      // Check success logs this month
      const successLog = await trx('payment_logs')
        .innerJoin('payment_logs_project_payment_lnk', 'payment_logs.id', 'payment_logs_project_payment_lnk.payment_log_id')
        .where('payment_logs_project_payment_lnk.project_payment_id', projectPaymentRecord.id)
        .andWhere('payment_logs.success', true)
        .andWhere('payment_logs.created_at', '>=', startOfMonth.toISOString())
        .andWhere('payment_logs.created_at', '<', startOfNextMonth.toISOString())
        .first();

      if (successLog) {
        await trx.rollback();
        return { alreadyProcessed: true };
      }

      const threeDaysAgo = new Date(currentDate);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const recentFailedLog = await trx('payment_logs')
        .innerJoin('payment_logs_project_payment_lnk', 'payment_logs.id', 'payment_logs_project_payment_lnk.payment_log_id')
        .where('payment_logs_project_payment_lnk.project_payment_id', projectPaymentRecord.id)
        .andWhere('payment_logs.success', false)
        .andWhere('payment_logs.created_at', '>=', threeDaysAgo.toISOString())
        .first();

      if (recentFailedLog) {
        await trx.rollback();
        return { alreadyProcessed: true };
      }

      // Not processed yet - create payment log WITHIN this transaction
      // This ensures atomicity: lock check + log creation are atomic
      const { CURRENCIES } = await import('../constants/currencies');
      const documentId = require('crypto').randomBytes(12).toString('hex').slice(0, 24);
      const now = new Date().toISOString();

      const logIdResult = await trx('payment_logs').insert({
        document_id: documentId,
        amount: paymentDetails.Amount,
        currency: CURRENCIES[paymentDetails.Currency ?? process.env.CURRENCY_AM] ?? 'AMD',
        details: JSON.stringify(paymentDetails || {}),
        success: success,
        payment_id: paymentDetails.PaymentID || null,
        order_id: paymentDetails.OrderId || null,
        payment_status: success ? 'completed' : null,
        user_document_id: userDocumentId || null,
        project_document_id: projectDocumentId || null,
        project_name: projectName || null,
        created_at: now,
        updated_at: now,
      }).returning('id');

      // Knex .returning('id') returns an array of objects: [{ id: 116 }]
      const logId = (logIdResult as any)[0].id;

      // Create the link between payment_log and project_payment
      if (logId && projectPaymentRecord) {
        await trx('payment_logs_project_payment_lnk').insert({
          payment_log_id: logId,
          project_payment_id: projectPaymentRecord.id,
        });
      }

      // Commit the entire transaction atomically
      await trx.commit();
      return { alreadyProcessed: false, logCreated: true };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  },

  doRecurringPaymentWithAtomicLock: async ({
    projectPaymentId,
    projectPaymentData,
    orderId,
  }: {
    projectPaymentId: string;
    projectPaymentData: any;
    orderId: string;
  }) => {
    // Start a database transaction with row-level lock
    const trx = await strapi.db.connection.transaction();

    try {
      // Acquire exclusive lock on the project_payment row
      const projectPaymentRecord = await trx('project_payments')
        .where({ document_id: projectPaymentId })
        .forUpdate()
        .first();

      if (!projectPaymentRecord) {
        await trx.rollback();
        throw new Error('Project payment not found');
      }

      // CRITICAL: Use Armenia timezone (UTC+4) for month boundary, not server local time
      const armeniaTimeStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Yerevan' });
      const currentDate = new Date(armeniaTimeStr);
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      // Use < startOfNextMonth instead of <= endOfMonth to avoid midnight off-by-one
      const startOfNextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

      // Check success logs this month
      const successLog = await trx('payment_logs')
        .innerJoin('payment_logs_project_payment_lnk', 'payment_logs.id', 'payment_logs_project_payment_lnk.payment_log_id')
        .where('payment_logs_project_payment_lnk.project_payment_id', projectPaymentRecord.id)
        .andWhere('payment_logs.success', true)
        .andWhere('payment_logs.created_at', '>=', startOfMonth.toISOString())
        .andWhere('payment_logs.created_at', '<', startOfNextMonth.toISOString())
        .first();

      if (successLog) {
        await trx.rollback();
        return { alreadyProcessed: true, reason: 'success_this_month', charged: false, logCreated: false };
      }

      // Block same-cron-run retries: if payment failed in the last 3 days, skip.
      // 3 days < 10-day interval between cron runs (4th, 14th, 24th), so the 14th cron
      // sees the 4th's failure as old enough and retries.
      const threeDaysAgo = new Date(currentDate);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const recentFailedLog = await trx('payment_logs')
        .innerJoin('payment_logs_project_payment_lnk', 'payment_logs.id', 'payment_logs_project_payment_lnk.payment_log_id')
        .where('payment_logs_project_payment_lnk.project_payment_id', projectPaymentRecord.id)
        .andWhere('payment_logs.success', false)
        .andWhere('payment_logs.created_at', '>=', threeDaysAgo.toISOString())
        .first();

      if (recentFailedLog) {
        await trx.rollback();
        return { alreadyProcessed: true, reason: 'failed_recently', charged: false, logCreated: false };
      }

      // CRITICAL: Charge the bank while still holding the lock
      // This prevents concurrent requests from both charging before any creates a log
      const paymentDetails = await bankingService.makeBindingPayment({
        projectPayment: {
          Amount: projectPaymentData.amount,
          CardHolderID: projectPaymentData.CardHolderID,
          currency: projectPaymentData.currency,
        },
        orderId,
        projectDocumentId: projectPaymentData.projectDocumentId,
        projectSlug: projectPaymentData.projectSlug,
      });

      const isSuccess = paymentDetails.ResponseCode === process.env.SUCCESS_RESPONSE_CODE;

      // Create payment log WITHIN this transaction
      const { CURRENCIES } = await import('../constants/currencies');
      const documentId = require('crypto').randomBytes(12).toString('hex').slice(0, 24);
      const now = new Date().toISOString();

      const logIdResult = await trx('payment_logs').insert({
        document_id: documentId,
        amount: paymentDetails.Amount,
        currency: CURRENCIES[paymentDetails.Currency ?? process.env.CURRENCY_AM] ?? 'AMD',
        details: JSON.stringify(paymentDetails || {}),
        success: isSuccess,
        payment_id: paymentDetails.PaymentID || null,
        order_id: paymentDetails.OrderId || null,
        payment_status: isSuccess ? 'completed' : null,
        user_document_id: projectPaymentData.userDocumentId || null,
        project_document_id: projectPaymentData.projectDocumentId || null,
        project_name: projectPaymentData.projectName || null,
        created_at: now,
        updated_at: now,
      }).returning('id');

      const logId = (logIdResult as any)[0].id;

      // Create the link between payment_log and project_payment
      if (logId && projectPaymentRecord) {
        await trx('payment_logs_project_payment_lnk').insert({
          payment_log_id: logId,
          project_payment_id: projectPaymentRecord.id,
        });
      }

      // Commit the entire transaction atomically
      await trx.commit();

      return {
        alreadyProcessed: false,
        charged: true,
        logCreated: true,
        paymentDetails,
        isSuccess,
      };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  },

  sendDonationNotification: async ({
    amount,
    currency,
    projectName,
    donationType,
    userDocumentId,
  }: {
    amount: number;
    currency: string;
    projectName: string;
    donationType?: string;
    userDocumentId?: string;
  }) => {
    const { CURRENCIES } = await import('../constants/currencies');
    const currencyLabel = CURRENCIES[currency] ?? currency;
    const adminUrl = process.env.BASE_URL
      ? `${process.env.BASE_URL}/admin`
      : 'https://api.instepanavan.am/admin';
    const date = new Date().toLocaleString('hy-AM', { timeZone: 'Asia/Yerevan' });

    let donorEmail = '';
    let donorName = '';
    if (userDocumentId) {
      try {
        const user = await strapi.documents('plugin::users-permissions.user').findOne({
          documentId: userDocumentId,
          fields: ['email', 'username', 'fullName'],
        });
        if (user) {
          donorEmail = user.email ?? '';
          donorName = (user.fullName || (!user.username?.includes('@') ? user.username : '')) ?? '';
        }
      } catch (_) {}
    }

    const donationTypeLabel = donationType === 'recurring' ? 'Ամսական (կրկնվող)' : 'Միանվագ';

    const donorRow = donorEmail
      ? `<tr>
          <td style="padding: 8px 0; color: #666;">Նվիրատու</td>
          <td style="padding: 8px 0;">${donorName ? `${donorName} &lt;${donorEmail}&gt;` : donorEmail}</td>
        </tr>`
      : '';

    await strapi.plugin('email').service('email').send({
      to: 'contact@instepanavan.am',
      subject: `Նոր նվիրատվություն — ${projectName}`,
      text: `Նոր նվիրատվություն ստացվել է:\n\nՆախագիծ: ${projectName}\nԳումար: ${amount} ${currencyLabel}\nՏեսակ: ${donationTypeLabel}${donorEmail ? `\nՆվիրատու: ${donorName ? `${donorName} <${donorEmail}>` : donorEmail}` : ''}\nԱմսաթիվ: ${date}\n\nAdmin: ${adminUrl}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Նոր նվիրատվություն</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666;">Նախագիծ</td>
              <td style="padding: 8px 0; font-weight: bold;">${projectName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Գումար</td>
              <td style="padding: 8px 0; font-weight: bold; color: #16a34a;">${amount} ${currencyLabel}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Տեսակ</td>
              <td style="padding: 8px 0;">${donationTypeLabel}</td>
            </tr>
            ${donorRow}
            <tr>
              <td style="padding: 8px 0; color: #666;">Ամսաթիվ</td>
              <td style="padding: 8px 0;">${date}</td>
            </tr>
          </table>
          <p style="margin-top: 24px;">
            <a href="${adminUrl}" style="color: #6366f1;">Բացել Admin Panel</a>
          </p>
        </div>
      `,
    });
  },
};

export default service;
