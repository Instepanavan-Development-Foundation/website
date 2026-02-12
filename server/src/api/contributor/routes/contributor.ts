/**
 * contributor router
 */

import { factories } from '@strapi/strapi';

const defaultRouter = factories.createCoreRouter('api::contributor.contributor');

const customRouter = (innerRouter, extraRoutes = []) => {
  let routes;
  return {
    get prefix() {
      return innerRouter.prefix;
    },
    get routes() {
      if (!routes) routes = innerRouter.routes.concat(extraRoutes);
      return routes;
    },
  };
};

const myExtraRoutes = [
  {
    method: 'GET',
    path: '/contributor/by-user/:documentId',
    handler: 'contributor.findByUser',
    config: {
      policies: [],
      middlewares: [],
      auth: false,
    },
  },
  {
    method: 'GET',
    path: '/contributor/payment-history/:userDocumentId',
    handler: 'contributor.getPaymentHistory',
    config: {
      policies: [],
      middlewares: [],
    },
  },
  {
    method: 'GET',
    path: '/contributor/subscriptions/:userDocumentId',
    handler: 'contributor.getSubscriptions',
    config: {
      policies: [],
      middlewares: [],
    },
  },
];

export default customRouter(defaultRouter, myExtraRoutes);
