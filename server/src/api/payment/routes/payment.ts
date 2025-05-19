export default {
  routes: [
    {
      method: "POST",
      path: "/payment/init-payment",
      handler: "payment.initPayment",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/payment/get-payment-details",
      handler: "payment.getPaymentDetails",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/payment/do-recurring-payment",
      handler: "payment.doRecurringPayment",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
