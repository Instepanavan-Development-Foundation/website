/**
 * payment-log router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::payment-log.payment-log', {
  config: {
    find: {
      policies: ['global::is-owner'],
    },
    findOne: {
      policies: ['global::is-owner'],
    },
  },
});
