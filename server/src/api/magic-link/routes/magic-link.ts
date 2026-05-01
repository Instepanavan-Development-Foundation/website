export default {
  routes: [
    {
      method: "POST",
      path: "/magic-link/send",
      handler: "magic-link.send",
      config: {
        policies: [],
        middlewares: [],
        auth: false,
      },
    },
    {
      method: "GET",
      path: "/magic-link/verify",
      handler: "magic-link.verify",
      config: {
        policies: [],
        middlewares: [],
        auth: false,
      },
    },
    {
      method: "POST",
      path: "/magic-link/verify-otp",
      handler: "magic-link.verifyOtp",
      config: {
        policies: [],
        middlewares: [],
        auth: false,
      },
    },
  ],
};
