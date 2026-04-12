import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { parseAmeriabankError } from "../utils/ameriabank-error-parser";

type TPaymentMethods = "ameriabank";

interface IPaymentParams {
  ClientID: string;
  Amount: number; // 10 for testing
  OrderID: string;
  Currency: string; // TODO: change to currencies enum
  BackURL: string;
  Username: string;
  Password: string;
  Description: string;
  Timeout: number;
  CardHolderID: string;
  PaymentType: number;
}

interface IPaymentParamsProps {
  amount: number;
  projectDocumentId?: string;
  projectSlug?: string;
  projectName?: string;
  orderId: number;
  currencyCode: string; // TODO: change to currencies enum,
  email?: string;
  CardHolderID?: string;
}

const paymentService = {
  getParams: ({
    amount,
    projectDocumentId,
    projectSlug,
    projectName,
    orderId,
    currencyCode = process.env.CURRENCY_AM,
    email,
    CardHolderID,
  }: IPaymentParamsProps): IPaymentParams => {
    const params: IPaymentParams = {
      ClientID: process.env.CLIENT_ID,
      Username: process.env.PAYMENT_USERNAME,
      Password: process.env.PAYMENT_PASSWORD,
      Currency: currencyCode,
      Description: `Donation for project ${projectSlug}`,
      OrderID: String(orderId),
      Amount: amount, // 10 for testing
      BackURL: `${process.env.BACK_URL}/payment-callback?project=${projectSlug}`,
      Timeout: Number(process.env.PAYMENT_TIMEOUT),
      PaymentType: 6, // move to enum, by ameria support
      CardHolderID: CardHolderID ?? `${email}_${projectDocumentId}_${uuidv4()}`,
    };

    return params;
  },

  // Params for MakeBindingPayment
  // Binding flow:
  //   1. InitPayment: we send a unique CardHolderID (email_projectId_uuid)
  //   2. User pays → Ameriabank creates a binding and returns BindingID + CardHolderID
  //   3. We save both to payment_methods table
  //   4. MakeBindingPayment: we only send CardHolderID — Ameriabank resolves the saved card from it
  //      BindingID is NOT part of the request (see MakeBindingPaymentRequest in vPOS docs)
  //      BindingID is saved for our own audit/reference only
  getBindingPaymentParams: ({
    amount,
    orderId,
    currencyCode = process.env.CURRENCY_AM,
    CardHolderID,
    projectSlug,
  }) => {
    const params: any = {
      ClientID: process.env.CLIENT_ID,
      Username: process.env.PAYMENT_USERNAME,
      Password: process.env.PAYMENT_PASSWORD,
      Amount: amount,
      OrderID: String(orderId),
      Currency: currencyCode,
      Description: "Recurring donation",
      BackURL: `${process.env.BACK_URL}/payment-callback?project=${projectSlug}`,
      Timeout: Number(process.env.PAYMENT_TIMEOUT),
      PaymentType: 6,
      CardHolderID,
    };

    return params;
  },
  getPaymentUrl: async ({
    amount,
    projectDocumentId,
    projectSlug,
    projectName,
    currencyCode,
    paymentMethod,
    lang,
    orderId,
    email,
  }) => {
    try {
      const url = `${process.env.PAYMENT_API_BASE_URL}/InitPayment`;
      const params = {
        amount,
        projectDocumentId,
        projectSlug,
        projectName,
        currencyCode,
        paymentMethod,
        orderId,
        email,
      };

      const response = await axios.post(url, paymentService.getParams(params), {
        headers: { "Content-Type": "application/json" },
      });

      if (response.data.PaymentID) {
        return {
          url: `${process.env.PAYMENT_API_DETAILS_URL}?id=${response.data.PaymentID}&lang=${lang}`,
          errorMessage: null,
        };
      }

      // Retry only on OrderID collision, return error for other cases
      console.log(
        "Payment initialization failed:",
        JSON.stringify(response.data, null, 2)
      );

      // Check if error is OrderID collision (you may need to adjust the error code)
      // For now, only retry on specific error codes that indicate OrderID collision
      const isOrderIdCollision = response.data.ResponseCode === "08204";

      if (isOrderIdCollision) {
        const newOrderId = paymentService.getOrderId();
        return await paymentService.getPaymentUrl({
          amount,
          projectDocumentId,
          projectSlug,
          projectName,
          currencyCode,
          paymentMethod,
          lang,
          orderId: newOrderId,
          email,
        });
      }

      // Return error for all other cases
      return {
        url: null,
        errorMessage: parseAmeriabankError(response.data.ResponseCode, response.data.ResponseMessage),
      };
    } catch (e) {
      console.log(
        "something went wrong in /init-payment",
        JSON.stringify(e, null, 2)
      );

      return { url: null, errorMessage: e.message };
    }
  },
  getPaymentDetails: async (paymentId: string) => {
    try {
      const url = `${process.env.PAYMENT_API_BASE_URL}/GetPaymentDetails`;
      const response = await axios.post(
        url,
        {
          PaymentID: paymentId,
          Username: process.env.PAYMENT_USERNAME,
          Password: process.env.PAYMENT_PASSWORD,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      return response.data;
    } catch (e) {
      console.log(
        "something went wrong in getPaymentDetails",
        JSON.stringify(e, null, 2)
      );
      return null;
    }
  },
  getOrderId: () => {
    // Use timestamp mod 1e9 to stay within safe integer bounds (~year 2033)
    return Date.now() % 1_000_000_000;
  },
  makeBindingPayment: async ({ projectPayment, orderId, projectDocumentId, projectSlug }) => {
    const { Amount, CardHolderID, currency } = projectPayment;
    const url = `${process.env.PAYMENT_API_BASE_URL}/MakeBindingPayment`;

    try {
      const requestParams = paymentService.getBindingPaymentParams({
        amount: Amount,
        CardHolderID,
        currencyCode: currency,
        orderId,
        projectSlug,
      });

      const response = await axios.post(url, requestParams, {
        headers: { "Content-Type": "application/json" },
        timeout: 30000, // 30 second timeout
      });

      return response.data;
    } catch (e) {
      console.error("MakeBindingPayment error:", e.response?.status, e.response?.data || e.message);
      if (e.response) {
        return e.response.data;
      }
      throw new Error(`Ameriabank API error: ${e.message}`);
    }
  },
  cancelPayment: async (paymentId: string) => {
    const url = `${process.env.PAYMENT_API_BASE_URL}/CancelPayment`;
    const response = await axios.post(url, {
      PaymentID: paymentId,
      Username: process.env.PAYMENT_USERNAME,
      Password: process.env.PAYMENT_PASSWORD,
    }, { headers: { "Content-Type": "application/json" } });
    return response.data;
  },
  refundPayment: async (paymentId: string, amount: number) => {
    const url = `${process.env.PAYMENT_API_BASE_URL}/RefundPayment`;
    const response = await axios.post(url, {
      PaymentID: paymentId,
      Username: process.env.PAYMENT_USERNAME,
      Password: process.env.PAYMENT_PASSWORD,
      Amount: amount,
    }, { headers: { "Content-Type": "application/json" } });
    return response.data;
  },
};

export default paymentService;
