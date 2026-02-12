/**
 * project controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::project.project', ({ strapi }) => ({
  async getProjectFunding(ctx) {
    const { documentId } = ctx.params;

    const data = await strapi.service('api::project.project').getProjectFunding(documentId);

    if (data === null) {
      return ctx.notFound('Project not found');
    }

    return { data };
  },

  async getDonorCount(ctx) {
    const { documentId } = ctx.params;

    const count = await strapi.service('api::project.project').getDonorCount(documentId);

    if (count === null) {
      return ctx.notFound('Project not found');
    }

    return { data: count };
  },
}));
