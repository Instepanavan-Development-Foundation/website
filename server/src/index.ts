import type { Core } from '@strapi/strapi';

import initQueue from "../queue/worker";

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await strapi.db.connection.raw(
      "CREATE SEQUENCE IF NOT EXISTS payment_order_id_seq START 1"
    );
    await strapi.db.connection.raw(
      "ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS order_id VARCHAR(255)"
    );
    initQueue(strapi);
  },
};
