import {
  PAYMENT_LOG_API,
  PAYMENT_METHOD_API,
  PROJECT_API,
  PROJECT_PAYMENT_API,
} from "../constants/apis";
import { CURRENCIES } from "../constants/currencies";

const service = {
  savePayment: async ({ paymentDetails, projectDocumentId, projectPaymentId }) => {
    if (paymentDetails.ResponseCode !== process.env.SUCCESS_RESPONSE_CODE) {
      JSON.stringify({
        paymentDetails,
        success: false,
      });
      throw new Error(JSON.stringify({ paymentDetails, success: false }));
    }

    const projectPaymentMethod =
      await service.createProjectPaymentMethod(paymentDetails);

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

    await service.createProjectPayment({
      paymentDetails,
      projectPaymentMethod,
      paymentLog,
      projectDocumentId,
    });

    await service.updateProjectData({
      projectDocumentId,
      data: {
        gatheredAmount: currentProject.gatheredAmount + paymentDetails.Amount,
        isArchived:
          currentProject.gatheredAmount + paymentDetails.Amount >=
          currentProject.requiredAmount,
      },
    });
  },
  createProjectPayment: async ({
    paymentDetails,
    projectPaymentMethod,
    paymentLog,
    projectDocumentId,
  }) => {
    try {
      const projectPayment = await strapi
        .documents(PROJECT_PAYMENT_API)
        .create({
          data: {
            amount: paymentDetails.Amount,
            currency: paymentDetails.Currency,
            type: "recurring", // TODO add dynamic value after adding subscription
            name: paymentDetails.Description,
            payment_method: projectPaymentMethod.documentId,
            payment_logs: [paymentLog.documentId], // TODO: check if this is correct and doesn't rewrite previous values
            project: projectDocumentId,
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
        "something went wrong in createProjectPayment",
        JSON.stringify(e, null, 2)
      );
    }
  },
  updateProjectData: async ({ projectDocumentId, data }) => {
    try {
      await strapi.documents(PROJECT_API).update({
        documentId: projectDocumentId,
        data: data,
      });
    } catch (e) {
      console.log(
        "something went wrong in updateProjectData",
        JSON.stringify(e, null, 2)
      );
    }
  },
  createProjectPaymentMethod: async (paymentDetails: any) => {
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
          // users_permissions_user: 1 // TODO, remove hardcode
        },
      });
    } catch (e) {
      console.log(
        "something went wrong in getProjectPaymentMethod",
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

      if(success) {
        // TODO: add logic to update project payment with this log
      }

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
            fields: ["id", "donationType", "name"],
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
      data: { isPaymentInProgress },
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

    const logs = await strapi.documents(PAYMENT_LOG_API).findMany({
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

    return logs[0];
  },
};

export default service;
