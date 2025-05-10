import axios from "axios";

const paymentService = {
  getParams: ({
    amount,
    projectDocumentId,
    paymentMethod,
    orderId,
    currencyCode = process.env.CURRENCY_AM,
  }) => {
    return {
      ClientID: process.env.CLIENT_ID,
      Amount: amount, // 10 for testing
      OrderID: orderId,
      Currency: currencyCode,
      BackURL: process.env.BACK_URL,
      Username: process.env.PAYMENT_USERNAME,
      Password: process.env.PAYMENT_PASSWORD,
      Description: `Donate for project ${projectDocumentId}`,
      CardHolderID: "sample string", // for subscription mode: some unique id
      Timeout: Number(process.env.PAYMENT_TIMEOUT),
      Opaque: JSON.stringify({ projectDocumentId, paymentMethod }),
    };
  },
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
      const params = {
        amount,
        projectDocumentId,
        currencyCode,
        paymentMethod,
        orderId,
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
};

export default paymentService;
