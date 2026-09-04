/**
 * payment-log controller
 *
 * IMMUTABLE: Payment logs are an audit trail and must never be deleted.
 * Deletion is blocked at the controller level. To void a payment, update
 * the paymentStatus field (e.g. 'cancelled', 'refunded') instead.
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::payment-log.payment-log', ({ strapi }) => ({
  // Scoped to the caller's own logs — the default core find/findOne have no
  // ownership filtering at all, which would leak every user's donation history
  // (and, without a fields allowlist, raw bank details) to any authenticated caller.
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized();
    }

    const { sort, pagination } = ctx.query;

    const entries = await strapi.documents('api::payment-log.payment-log').findMany({
      sort: sort as any,
      pagination: pagination as any,
      filters: {
        userDocumentId: user.documentId,
      } as any,
      // Never include `details` (raw Ameriabank response) or `paymentId` (bank
      // transaction id) here — those are private per CLAUDE.md's payment data rules.
      fields: ['documentId', 'amount', 'currency', 'success', 'createdAt', 'projectDocumentId', 'projectName'],
    });

    return { data: entries, meta: {} };
  },

  async findOne(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized();
    }

    const { id } = ctx.params;
    const entry = await strapi.documents('api::payment-log.payment-log').findOne({
      documentId: id,
      filters: {
        userDocumentId: user.documentId,
      } as any,
      fields: ['documentId', 'amount', 'currency', 'success', 'createdAt', 'projectDocumentId', 'projectName'],
    });

    if (!entry) {
      return ctx.notFound();
    }

    return { data: entry };
  },

  // Block all delete operations — payment logs are immutable audit records
  async delete(ctx) {
    return ctx.forbidden('Payment logs are immutable and cannot be deleted.');
  },
}));
