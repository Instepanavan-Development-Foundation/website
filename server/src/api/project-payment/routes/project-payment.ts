/**
 * project-payment router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::project-payment.project-payment', {
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
