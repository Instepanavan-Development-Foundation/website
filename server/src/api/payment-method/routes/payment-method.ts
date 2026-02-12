/**
 * payment-method router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::payment-method.payment-method', {
  config: {
    find: {
      policies: ['global::is-owner'],
    },
    findOne: {
      policies: ['global::is-owner'],
    },
    delete: {
      policies: ['global::is-owner'],
    },
  },
});
