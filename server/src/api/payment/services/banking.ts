import axios from "axios";
import xml2js from "xml2js";

const getParams = ({
  amount,
  projectDocumentId,
  paymentMethod,
  orderId,
  currencyCode = process.env.CURRENCY_AM,
}) => ({
  ClientID: process.env.CLIENT_ID,
  Amount: amount, // 10 for testing
  OrderID: orderId, //TODO: createOrderId logic?
  Currency: currencyCode,
  BackURL: process.env.BACK_URL,
  Username: process.env.PAYMENT_USERNAME,
  Password: process.env.PAYMENT_PASSWORD,
  Description: `Donate for project ${projectDocumentId}`,
  CardHolderID: "sample string", // for subscription mode: some unique id
  Timeout: Number(process.env.PAYMENT_TIMEOUT),
  Opaque: JSON.stringify({ projectDocumentId, paymentMethod }),
});

export default () => ({
  getPaymentUrl: async ({
    amount,
    projectDocumentId,
    currencyCode,
    paymentMethod,
    lang,
    orderId,
  }) => {
    try {
      const url = `${process.env.PAYMENT_API_BASE_URL}/InitPayment`;

      const response = await axios.post(
        url,
        getParams({
          amount,
          projectDocumentId,
          currencyCode,
          paymentMethod,
          orderId,
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.data.PaymentID) {
        console.log(
          "something went wrong in /init-payment",
          JSON.stringify(response.data, null, 2)
        );

        return {
          url: null,
          errorMessage: "something went wrong with getting payment id",
        };
      }

      return {
        url: `${process.env.PAYMENT_API_DETAILS_URL}?id=${response.data.PaymentID}&lang=${lang}`,
        errorMessage: null,
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
});
