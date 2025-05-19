const PAYMENT_API = "api::payment.payment";

export default {
  initPayment: async (ctx, next) => {
    const {
      amount,
      projectDocumentId, // TODO: we have donationType in db, handle it!
      currencyCode = process.env.CURRENCY_AM,
      lang = "am",
      paymentMethod = "ameriabank",
      email = "",
    } = ctx.request.body;

    if (!amount || !projectDocumentId) {
      return ctx.send(
        { error: "amount and projectDocumentId fields are required" },
        400
      );
    }

    const service = strapi.service(PAYMENT_API);

    const orderId = await service.getOrderId();
    if (!orderId) {
      return ctx.send({ errorMessage: "Failed to get latest orderId" }, 500);
    }

    const { url, errorMessage } = await service.getPaymentUrl({
      amount,
      projectDocumentId,
      currencyCode,
      paymentMethod,
      lang,
      orderId,
      email,
    });

    if (errorMessage) {
      return ctx.send({ errorMessage }, 500);
    }

    return ctx.send({ url }, 200);
  },
  getPaymentDetails: async (ctx, next) => {
    const service = strapi.service(PAYMENT_API);

    try {
      const { paymentId, projectDocumentId } = ctx.request.body;

      if (!paymentId || !projectDocumentId) {
        return ctx.send(
          { error: "paymentId and projectDocumentID fields are required" },
          400
        );
      }

      const paymentDetails = await service.getPaymentDetails(paymentId);
      await service.savePayment({ paymentDetails, projectDocumentId });

      return ctx.send(true, 200);
    } catch (error) {
      await service.createPaymentLog(error.message);
      return ctx.send({ errorMessage: error.message }, 500);
    }
  },
  doRecurringPayment: async (ctx, next) => {
    try {
      const { projectPaymentId } = ctx.request.body;
      // TODO, close endpoint from outside
      const service = strapi.service(PAYMENT_API);

      const projectPayment =
        await service.getProjectPaymentWithMethod(projectPaymentId);

      const orderId = await service.getOrderId();
      if (!orderId) {
        return ctx.send({ errorMessage: "Failed to get latest orderId" }, 500);
      }

      const paymentDetails = await service.makeBindingPayment({
        projectPayment,
        orderId,
      });

      await service.savePayment({ paymentDetails });
    } catch (error) {
      console.log(error);
      return ctx.send({ errorMessage: error.message }, 500);
    }
  },
};
