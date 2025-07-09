import axios from "axios";
import { v4 as uuidv4 } from "uuid";

type TPaymentMethods = "ameriabank";

interface IPaymentParams {
  ClientID: string;
  Amount: number; // 10 for testing
  OrderID: number;
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
  orderId: number;
  currencyCode: string; // TODO: change to currencies enum,
  email?: string;
  CardHolderID?: string;
}

const paymentService = {
  getParams: ({
    amount,
    projectDocumentId,
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
      Description: `Donation for project ${projectDocumentId}`, // TODO, replace to projectName
      OrderID: orderId,
      Amount: amount, // 10 for testing
      BackURL: process.env.BACK_URL,
      Timeout: Number(process.env.PAYMENT_TIMEOUT),
      PaymentType: 6, // move to enum, by ameria support
      CardHolderID: CardHolderID ?? `${email}_${projectDocumentId}_${uuidv4()}`,
    };

    return params;
  },
  getPaymentUrl: async ({
    amount,
    projectDocumentId,
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

      console.log(
        "something went wrong in /init-payment",
        JSON.stringify(response.data, null, 2)
      );

      const newOrderId = paymentService.getOrderId();
      return await paymentService.getPaymentUrl({
        amount,
        projectDocumentId,
        currencyCode,
        paymentMethod,
        lang,
        orderId: newOrderId,
        email,
      });
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
    const minValue = parseInt(process.env.MIN_ORDER_ID || "3831001", 10);
    const maxValue = parseInt(process.env.MAX_ORDER_ID || "3832000", 10);

    return Math.trunc(Math.random() * (maxValue - minValue) + minValue);
  },
  makeBindingPayment: async ({ projectPayment, orderId }) => {
    const { Amount, CardHolderID, currency } = projectPayment;
    const url = `${process.env.PAYMENT_API_BASE_URL}/MakeBindingPayment`;

    const params = {
      amount: Amount,
      CardHolderID,
      currencyCode: currency,
      orderId,
    };
    const response = await axios.post(url, paymentService.getParams(params), {
      headers: { "Content-Type": "application/json" },
    });

    return response.data;
  },
};

export default paymentService;
