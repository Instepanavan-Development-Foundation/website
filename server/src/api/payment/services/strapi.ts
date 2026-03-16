import {
  PAYMENT_LOG_API,
  PAYMENT_METHOD_API,
  PROJECT_API,
  PROJECT_PAYMENT_API,
} from "../constants/apis";
import { CURRENCIES } from "../constants/currencies";

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

    const paymentLog = await service.createPaymentLog({
      paymentDetails,
      projectPaymentId,
      success: true,
    });

    if (!projectDocumentId) {
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

    const newGatheredAmount = currentProject.gatheredAmount + paymentDetails.Amount;

    await service.createProjectPayment({
      paymentDetails,
      projectPaymentMethod,
      paymentLog,
      project: currentProject,
    });

    await service.updateProjectData({
      projectDocumentId,
      data: {
        gatheredAmount: newGatheredAmount,
        isArchived:
          newGatheredAmount >= currentProject.requiredAmount,
      },
    });
  },
  createProjectPayment: async ({
    paymentDetails,
    projectPaymentMethod,
    paymentLog,
    project,
  }) => {
    try {
      const projectPayment = await strapi
        .documents(PROJECT_PAYMENT_API)
        .create({
          data: {
            amount: paymentDetails.Amount,
            currency: paymentDetails.Currency,
            type: project?.donationType || "recurring",
            name: project?.name || paymentDetails.Description,
            payment_method: projectPaymentMethod.documentId,
            payment_logs: [paymentLog.documentId],
            project: project.documentId,
          },
        });

      await service.createPaymentLog({
        success: true,
        paymentDetails,
        projectPaymentId: projectPayment.documentId,
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
  createPaymentLog: async ({
    paymentDetails,
    success,
    projectPaymentId,
  }: {
    paymentDetails: any;
    success: boolean;
    projectPaymentId?: string;
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
          project_payment: projectPaymentId,
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
            fields: ["params"],
          },
          project: {
            fields: ["documentId", "donationType", "name"],
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
    const currentDate = new Date();
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const endOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    // First check: Has this payment succeeded THIS MONTH?
    const successLogs = await strapi.documents(PAYMENT_LOG_API).findMany({
      filters: {
        project_payment: {
          documentId: projectPaymentId,
        },
        success: true,
        createdAt: {
          $gte: startOfMonth.toISOString(),
          $lte: endOfMonth.toISOString(),
        },
      },
    });

    // If successful payment this month, don't retry
    if (successLogs.length > 0) {
      return successLogs[0];
    }

    // Second check: Has this payment FAILED in the last 10 days?
    const tenDaysAgo = new Date(currentDate);
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    const recentFailedLogs = await strapi.documents(PAYMENT_LOG_API).findMany({
      filters: {
        project_payment: {
          documentId: projectPaymentId,
        },
        success: false,
        createdAt: {
          $gte: tenDaysAgo.toISOString(),
        },
      },
    });

    // If failed in last 10 days, skip (don't spam failed attempts)
    if (recentFailedLogs.length > 0) {
      return recentFailedLogs[0];
    }

    // No successful payment this month AND no failed attempt in last 10 days = OK to process
    return null;
  },
};

export default service;
