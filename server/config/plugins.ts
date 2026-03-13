export default ({ env }) => ({
  email: {
    config: {
      provider: "@strapi/provider-email-nodemailer",
      providerOptions: {
        host: "smtp.resend.com",
        port: 465,
        secure: true,
        auth: {
          user: "resend",
          pass: env("RESEND_API_KEY"),
        },
      },
      settings: {
        defaultFrom: "no-reply@instepanavan.am",
        defaultReplyTo: "info@instepanavan.am",
      },
    },
  },
});
