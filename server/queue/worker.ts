import type { Core } from '@strapi/strapi';
import {startRecurringPaymentSystem} from "./workflow";

export default async function initQueue(strapi: Core.Strapi) {
  try {
    const started = await startRecurringPaymentSystem(strapi);
    if (started) {
      console.log('✅ Recurring payment system initialized successfully');
    }
  } catch (error) {
    console.warn('⚠️ Failed to initialize recurring payment system:', error.message);
    console.warn('⚠️ Recurring payments will not be processed automatically.');
  }
}
