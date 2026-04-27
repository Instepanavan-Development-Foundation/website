export default (plugin) => {
  const originalUserFactory = plugin.controllers.user;

  plugin.controllers.user = ({ strapi: strapiInstance }) => {
    const originalUser = originalUserFactory({ strapi: strapiInstance });

    originalUser.updateMe = async (ctx) => {
      const userId = ctx.state.user?.id;

      if (!userId) {
        return ctx.unauthorized("User not authenticated");
      }

      const allowedFields = ["fullName"];
      const updates: Record<string, unknown> = {};

      for (const field of allowedFields) {
        if (field in ctx.request.body) {
          updates[field] = ctx.request.body[field];
        }
      }

      const user = await strapiInstance.db
        .query("plugin::users-permissions.user")
        .update({ where: { id: userId }, data: updates });

      ctx.body = { id: user.id, documentId: user.documentId, fullName: user.fullName };
    };

    return originalUser;
  };

  plugin.routes["content-api"].routes.push({
    method: "PUT",
    path: "/users/me",
    handler: "user.updateMe",
    config: { prefix: "" },
  });

  return plugin;
};
