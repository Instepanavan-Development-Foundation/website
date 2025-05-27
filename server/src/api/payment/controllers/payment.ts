const PAYMENT_API = "api::payment.payment";

export default {
  initPayment: async (ctx, next) => {
    const {
      amount,
      projectDocumentId, // TODO: we have donationType in db, handle it!
      currencyCode = process.env.CURRENCY_AM,
      lang = "am",
      paymentMethod = "ameriabank",
      email,
    } = ctx.request.body;

    if (!amount || !projectDocumentId || !email) {
      return ctx.send(
        { error: "email, amount and projectDocumentId fields are required" },
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
    const { projectPaymentId } = ctx.request.body;
    const service = strapi.service(PAYMENT_API);

    try {
      // TODO, close endpoint from outside

      const projectPayment =
        await service.getProjectPaymentWithMethod(projectPaymentId);
console.log(projectPayment);

      if (!projectPayment.project) {
        throw new Error("No project found");
      }

      if (projectPayment.project.donationType !== "recurring") {
        throw new Error("Project donation type is not recurring");
      }

      // find payment log for this month with projectPaymentId, success: true,
      const projectPaymentLogForThisMonth =
        await service.getProjectPaymentLogForThisMonth(projectPaymentId);
      if (projectPaymentLogForThisMonth) {
        throw Error(`The payment was already processed this month`);
      }
      // if payment is in progress, skipping the payment
      if (projectPayment.isPaymentInProgress) {
        throw Error(
          `Project Payment with projectPaymentId ${projectPaymentId}  is in progress`
        );
      }

      await service.updateProjectPaymentIsPaymentInProgress(
        projectPaymentId,
        true
      );

      const orderId = await service.getOrderId();
      if (!orderId) {
        return ctx.send({ errorMessage: "Failed to get latest orderId" }, 500);
      }

      const paymentDetails = await service.makeBindingPayment({
        projectPayment,
        orderId,
      });

      await service.createPaymentLog({
        paymentDetails,
        projectPaymentId,
        success: true,
      });

      await service.updateProjectPaymentIsPaymentInProgress(
        projectPaymentId,
        false
      );

      return ctx.send(true, 200);
    } catch (error) {
      console.log(error);
      await service.updateProjectPaymentIsPaymentInProgress(
        projectPaymentId,
        false
      );
      return ctx.send({ errorMessage: error.message }, 500);
    }
  },
};
