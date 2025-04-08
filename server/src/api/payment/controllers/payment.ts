const PAYMENT_API = "api::payment.payment";

export default {
  initPayment: async (ctx, next) => {
    const {
      amount,
      projectDocumentId,
      currencyCode = process.env.CURRENCY_AM,
      lang = "am",
      paymentMethod = "ameriabank",
    } = ctx.request.body;

    if (!amount || !projectDocumentId) {
      return ctx.send(
        { error: "amount and projectDocumentId fields are required" },
        400
      );
    }

    const service = strapi.service(PAYMENT_API);

    const { url, errorMessage } = await service.getPaymentUrl({
      amount,
      projectDocumentId,
      currencyCode,
      paymentMethod,
      lang,
    });

    if (errorMessage) {
      return ctx.send({ errorMessage }, 500);
    }

    return ctx.send({ url }, 200);
  },
  getPaymentDetails: async (ctx, next) => {
    try {
      const { paymentId, projectDocumentId, paymentMethod } = ctx.request.body;

      if (!paymentId || !projectDocumentId) {
        return ctx.send(
          { error: "paymentId and projectDocumentID fields are required" },
          400
        );
      }

      const service = strapi.service(PAYMENT_API);

      const currentProject = await service.getProject(projectDocumentId);
      if (!currentProject) {
        return ctx.send({ errorMessage: "Project not found" }, 404);
      }

      const paymentDetails = await service.getPaymentDetails(paymentId);
      if (paymentDetails.ResponseCode !== process.env.SUCCESS_RESPONSE_CODE) {
        await service.createPaymentLog({ paymentDetails, amount: 0 });

        return ctx.send({ errorMessage: "Payment failed" }, 500);
      }

      const projectPaymentMethod =
        service.getProjectPaymentMethod(paymentMethod);
      if (!projectPaymentMethod) {
        return ctx.send({ error: "Payment method not found" }, 404);
      }

      const paymentLog = await service.createPaymentLog(paymentDetails);
      if (!paymentLog) {
        return ctx.send({ errorMessage: "Failed to create payment log" }, 500);
      }

      await service.createProjectPayment({
        paymentDetails,
        projectPaymentMethod,
        paymentLog,
        projectDocumentId,
      });

      await service.updateProjectData({
        projectDocumentId,
        data: {
          gatheredAmount: currentProject.gatheredAmount + paymentDetails.Amount,
          isArchived:
            currentProject.gatheredAmount + paymentDetails.Amount >=
            currentProject.requiredAmount,
        },
      });

      return ctx.send(true, 200);
    } catch (error) {
      return ctx.send({ errorMessage: error.message }, 500);
    }
  },
};
