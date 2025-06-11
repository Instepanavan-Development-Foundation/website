import type { Core } from '@strapi/strapi';
import {startRecurringPaymentSystem} from "./workflow";

export default async function initQueue(strapi: Core.Strapi) {
  startRecurringPaymentSystem(strapi);
}
