/**
 * payment-log controller
 *
 * IMMUTABLE: Payment logs are an audit trail and must never be deleted.
 * Deletion is blocked at the controller level. To void a payment, update
 * the paymentStatus field (e.g. 'cancelled', 'refunded') instead.
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::payment-log.payment-log', ({ strapi }) => ({
  // Block all delete operations — payment logs are immutable audit records
  async delete(ctx) {
    return ctx.forbidden('Payment logs are immutable and cannot be deleted.');
  },
}));
