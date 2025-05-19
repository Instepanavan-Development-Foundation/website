import {
  PAYMENT_LOG_API,
  PAYMENT_METHOD_API,
  PROJECT_API,
  PROJECT_PAYMENT_API,
} from "../constants/apis";
import { CURRENCIES } from "../constants/currencies";

const service = {
  savePayment: async ({ paymentDetails, projectDocumentId }) => {
    if (paymentDetails.ResponseCode !== process.env.SUCCESS_RESPONSE_CODE) {
      throw new Error(JSON.stringify({ paymentDetails, success: false }));
    }

    const projectPaymentMethod =
      await service.createProjectPaymentMethod(paymentDetails);

    if (!projectPaymentMethod) {
      throw new Error(
        JSON.stringify({
          paymentDetails: "Payment method not found",
          success: false,
        })
      );
    }

    const paymentLog = await service.createPaymentLog({
      paymentDetails,
      success: true,
    });

    if (!projectDocumentId) {
      return;
    }

    const currentProject = await service.getProject(projectDocumentId);
    if (!currentProject) {
      throw new Error(
        JSON.stringify({
          paymentDetails: `Project not found: ${projectDocumentId}`,
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
      await strapi.documents(PROJECT_PAYMENT_API).create({
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
  }: {
    paymentDetails: any;
    success: boolean;
  }) => {
    try {
      return await strapi.documents(PAYMENT_LOG_API).create({
        data: {
          amount: paymentDetails.Amount,
          currency:
            CURRENCIES[paymentDetails.Currency ?? process.env.CURRENCY_AM],
          details: JSON.stringify(paymentDetails || {}),
          orderId: paymentDetails.OrderId,
          success: success,
        },
      });
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
        fields: ["amount", "currency"],
        populate: {
          payment_method: {
            fields: ["params"],
          },
        },
      });

    if (!projectPayment) {
      throw new Error("No project payment");
    }

    const { amount, currency } = projectPayment;
    if (!amount) {
      throw new Error("No amount");
    }

    const params = projectPayment.payment_method.params as any;
    const { CardHolderID } = params;

    return { Amount: amount, CardHolderID, currency };
  },
};

export default service;
