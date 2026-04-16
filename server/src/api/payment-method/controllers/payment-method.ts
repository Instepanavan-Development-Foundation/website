/**
 * payment-method controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::payment-method.payment-method', ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized();
    }

    const entries = await strapi.documents('api::payment-method.payment-method').findMany({
      filters: {
        users_permissions_user: {
          id: user.id
        }
      },
      ...ctx.query
    });

    return { data: entries, meta: {} };
  },

  async findOne(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized();
    }

    const { id } = ctx.params;
    const entry = await strapi.documents('api::payment-method.payment-method').findOne({
      documentId: id,
      filters: {
        users_permissions_user: {
          id: user.id
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

    // First check if user owns this payment method
    const entry = await strapi.documents('api::payment-method.payment-method').findOne({
      documentId: id,
      filters: {
        users_permissions_user: {
          id: user.id
        }
      }
    });

    if (!entry) {
      return ctx.notFound();
    }

    // Delete all subscriptions linked to this payment method first
    const linkedSubscriptions = await strapi.documents('api::project-payment.project-payment').findMany({
      filters: {
        payment_method: { documentId: id },
      },
      fields: ['documentId'],
    });

    for (const sub of linkedSubscriptions) {
      await strapi.documents('api::project-payment.project-payment').delete({
        documentId: sub.documentId,
      });
    }

    // Delete the payment method
    await strapi.documents('api::payment-method.payment-method').delete({
      documentId: id
    });

    return { data: entry };
  },
}));
