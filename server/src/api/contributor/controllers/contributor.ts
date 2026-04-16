/**
 * contributor controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::contributor.contributor', ({ strapi }) => ({
  async findByUser(ctx) {
    const { documentId } = ctx.params;

    try {
      // Fetch user by documentId using documents API
      const user = await strapi.documents('plugin::users-permissions.user').findOne({
        documentId,
        fields: ['id', 'username'],
      });

      if (!user) {
        return ctx.notFound('User not found');
      }

      // Determine display name - NEVER expose email
      let displayName = '...';

      // Check if username is not an email format
      if (user.username && !user.username.includes('@')) {
        displayName = user.username;
      }

      // Return public user data (email is intentionally excluded)
      return ctx.send({
        id: user.id,
        username: displayName,
        fullName: displayName,
      });
    } catch (error) {
      console.error('Error fetching user by documentId:', error);
      return ctx.internalServerError('Failed to fetch user data');
    }
  },

  async getPaymentHistory(ctx) {
    const { userDocumentId } = ctx.params;

    // Check if user is authenticated
    if (!ctx.state.user) {
      return ctx.unauthorized('You must be logged in to access payment history');
    }

    // Check if the authenticated user is accessing their own data
    const authenticatedUserDocumentId = ctx.state.user.documentId;
    if (authenticatedUserDocumentId !== userDocumentId) {
      return ctx.forbidden('You can only access your own payment history');
    }

    try {
      const paymentLogs = await strapi.documents('api::payment-log.payment-log').findMany({
        filters: {
          userDocumentId,
        } as any,
        populate: {
          project_payment: {
            populate: {
              project: {
                fields: ['name', 'slug', 'documentId'],
              },
            },
          },
          donation: {
            populate: {
              project: {
                fields: ['name', 'slug', 'documentId'],
              },
            },
          },
        },
        fields: ['documentId', 'amount', 'currency', 'success', 'createdAt'],
        sort: ['createdAt:desc'],
        limit: 100,
      });

      return ctx.send({ data: paymentLogs });
    } catch (error) {
      console.error('Error fetching payment history:', error);
      return ctx.internalServerError('Failed to fetch payment history');
    }
  },

  async getSubscriptions(ctx) {
    const { userDocumentId } = ctx.params;

    // Check if user is authenticated
    if (!ctx.state.user) {
      return ctx.unauthorized('You must be logged in to access subscriptions');
    }

    // Check if the authenticated user is accessing their own data
    const authenticatedUserDocumentId = ctx.state.user.documentId;
    if (authenticatedUserDocumentId !== userDocumentId) {
      return ctx.forbidden('You can only access your own subscriptions');
    }

    try {
      // Get all payment methods for this user
      const paymentMethods = await strapi.documents('api::payment-method.payment-method').findMany({
        filters: {
          userDocumentId,
        },
        fields: ['documentId'],
      });

      if (paymentMethods.length === 0) {
        return ctx.send({ data: [] });
      }

      // Get all active project payments (subscriptions) for user's payment methods
      const paymentMethodIds = paymentMethods.map(pm => pm.documentId);

      const subscriptions = await strapi.documents('api::project-payment.project-payment').findMany({
        filters: {
          payment_method: {
            documentId: {
              $in: paymentMethodIds,
            },
          },
        },
        populate: {
          project: {
            fields: ['name', 'slug', 'documentId'],
            populate: {
              image: {
                fields: ['url'],
              },
            },
          },
          payment_method: {
            fields: ['documentId'],
          },
        },
        fields: ['documentId', 'amount', 'currency', 'type'],
      });

      return ctx.send({ data: subscriptions });
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      return ctx.internalServerError('Failed to fetch subscriptions');
    }
  },
}));
