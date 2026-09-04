/**
 * project-payment controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::project-payment.project-payment', ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized();
    }

    // Only pass through safe query params — never spread the whole ctx.query,
    // since a client-supplied `filters` key would replace (not AND with) the
    // ownership filter below and leak every user's subscriptions.
    const { sort, pagination } = ctx.query;

    const entries = await strapi.documents('api::project-payment.project-payment').findMany({
      sort: sort as any,
      pagination: pagination as any,
      filters: {
        payment_method: {
          users_permissions_user: {
            id: user.id
          }
        }
      },
    });

    return { data: entries, meta: {} };
  },

  async findOne(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized();
    }

    const { id } = ctx.params;
    const entry = await strapi.documents('api::project-payment.project-payment').findOne({
      documentId: id,
      filters: {
        payment_method: {
          users_permissions_user: {
            id: user.id
          }
        }
      }
    });

    if (!entry) {
      return ctx.notFound();
    }

    return { data: entry };
  },

  async delete(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized();
    }

    const { id } = ctx.params;

    // First check if user owns this project payment
    const entry = await strapi.documents('api::project-payment.project-payment').findOne({
      documentId: id,
      filters: {
        payment_method: {
          users_permissions_user: {
            id: user.id
          }
        }
      }
    });

    if (!entry) {
      return ctx.notFound();
    }

    // Delete it
    await strapi.documents('api::project-payment.project-payment').delete({
      documentId: id
    });

    return { data: entry };
  },
}));
