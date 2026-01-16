import type { Core } from '@strapi/strapi';
import {startRecurringPaymentSystem} from "./workflow";

export default async function initQueue(strapi: Core.Strapi) {
  try {
    await startRecurringPaymentSystem(strapi);
    console.log('✅ Hatchet recurring payment system initialized successfully');
  } catch (error) {
    console.warn('⚠️ Failed to initialize Hatchet recurring payment system:', error.message);
    console.warn('⚠️ Recurring payments will not be processed. This is OK if HATCHET_CLIENT_TOKEN is not configured.');
  }
}
