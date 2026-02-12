export default {
  routes: [
    {
      method: "POST",
      path: "/payment/init-payment",
      handler: "payment.initPayment",
      config: {
        policies: [],
        middlewares: [],
        auth: false,
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
        auth: false, // Admin auth via ADMIN_API_KEY header in controller
      },
    },
    {
      method: "POST",
      path: "/payment/trigger-all-payments",
      handler: "payment.triggerAllPayments",
      config: {
        policies: [],
        middlewares: [],
        auth: false, // Admin auth via ADMIN_API_KEY header in controller
      },
    },
    {
      method: "POST",
      path: "/payment/pay-with-saved-card",
      handler: "payment.payWithSavedCard",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
