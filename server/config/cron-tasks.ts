export default {
  // Daily at 3am — delete magic link tokens older than 24 hours
  "0 3 * * *": async ({ strapi }) => {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await strapi.db
      .query("api::magic-link-token.magic-link-token")
      .deleteMany({
        where: { createdAt: { $lt: cutoff } },
      });
  },
};
