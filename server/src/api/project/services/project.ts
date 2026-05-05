/**
 * project service
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::project.project', ({ strapi }) => ({
  async getProjectFunding(projectDocumentId: string) {
    // Get the project to ensure it exists
    const project = await strapi.documents('api::project.project').findFirst({
      filters: { documentId: projectDocumentId },
      fields: ['donationType', 'requiredAmount'],
    });

    if (!project) {
      return null;
    }

    // Get current month start/end dates
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Query one-time donation logs for this project
    const oneTimePaymentLogs = await strapi.documents('api::payment-log.payment-log').findMany({
      filters: {
        success: true,
        donation: {
          project: {
            documentId: projectDocumentId,
          },
        },
      },
      populate: ['donation'],
    });

    // Query recurring payment logs for this project directly by projectDocumentId
    const recurringPaymentLogs = await strapi.documents('api::payment-log.payment-log').findMany({
      filters: {
        success: true,
        projectDocumentId: projectDocumentId,
      } as any,
    });

    // Calculate current month recurring and all-time totals
    let currentMonthRecurring = { amount: 0, count: 0 };
    let allTimeRecurring = { amount: 0, count: 0 };
    let totalOneTime = { amount: 0, count: 0 };

    // Count one-time payments (all time)
    oneTimePaymentLogs.forEach((log) => {
      totalOneTime.amount += log.amount;
      totalOneTime.count += 1;
    });

    // Count recurring payments (both current month and all-time)
    recurringPaymentLogs.forEach((log) => {
      allTimeRecurring.amount += log.amount;
      allTimeRecurring.count += 1;
      const logDate = new Date(log.createdAt);
      if (logDate >= monthStart && logDate <= monthEnd) {
        currentMonthRecurring.amount += log.amount;
        currentMonthRecurring.count += 1;
      }
    });

    return {
      donationType: project.donationType,
      requiredAmount: project.requiredAmount || 0,
      currentMonth: {
        month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        recurring: currentMonthRecurring,
      },
      allTime: {
        oneTime: totalOneTime,
        recurring: allTimeRecurring,
      },
    };
  },

  async getDonorCount(projectDocumentId: string) {
    // Get the project to ensure it exists
    const project = await strapi.documents('api::project.project').findFirst({
      filters: { documentId: projectDocumentId },
    });

    if (!project) {
      return null;
    }

    // Get all successful payment logs for one-time donations to this project
    const donationPaymentLogs = await strapi.documents('api::payment-log.payment-log').findMany({
      filters: {
        success: true,
        donation: {
          project: {
            documentId: projectDocumentId,
          },
        },
      },
      populate: ['donation'],
    });

    // Get all successful payment logs for recurring payments to this project
    const recurringPaymentLogs = await strapi.documents('api::payment-log.payment-log').findMany({
      filters: {
        success: true,
        projectDocumentId: projectDocumentId,
      } as any,
      fields: ['userDocumentId'],
    });

    // Count unique donors by tracking unique users
    const uniqueDonors = new Set();

    // Count one-time donations (each is a unique donor)
    donationPaymentLogs.forEach((log) => {
      if (log.donation) {
        uniqueDonors.add(`donation-${log.donation.id}`);
      }
    });

    // Count recurring payments by unique user
    recurringPaymentLogs.forEach((log) => {
      uniqueDonors.add(`user-${log.userDocumentId}`);
    });

    return uniqueDonors.size;
  },
}));
