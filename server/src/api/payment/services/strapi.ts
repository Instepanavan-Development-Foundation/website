import {
  PAYMENT_LOG_API,
  PAYMENT_METHOD_API,
  PROJECT_API,
  PROJECT_PAYMENT_API,
} from "../constants/apis";
import { CURRENCIES } from "../constants/currencies";

export default () => ({
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
  getProjectPaymentMethod: async (paymentMethod: string) => {
    try {
      return await strapi.documents(PAYMENT_METHOD_API).findFirst({
        filters: {
          type: paymentMethod,
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
    amount,
  }: {
    paymentDetails: any;
    amount?: number;
  }) => {
    try {
      return await strapi.documents(PAYMENT_LOG_API).create({
        data: {
          amount: amount ?? paymentDetails.Amount,
          currency:
            CURRENCIES[paymentDetails.Currency ?? process.env.CURRENCY_AM],
          details: JSON.stringify(paymentDetails || {}),
          orderId: paymentDetails.OrderId,
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
  async getLatestOrderId() {
    try {
      const order = await strapi.documents(PAYMENT_LOG_API).findMany({
        sort: [{ createdAt: "asc" }],
        limit: 1,
        fields: ["orderId"],
      });

      return order[0].orderId;
    } catch (e) {
      console.log(
        "something went wrong in getLatestOrderId",
        JSON.stringify(e, null, 2)
      );

      return null;
    }
  },
});
