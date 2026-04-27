import axios from "axios";
import { RateLimitDuration } from "@hatchet-dev/typescript-sdk";

import { Core } from "@strapi/strapi";
import { hatchet } from "./hatchet-client";

let strapiGlobal: Core.Strapi;
interface ProcessPaymentInput {
  amount: number;
  documentId: string;
  email: string;
}
const axiosClient = axios.create({
  baseURL: process.env.BASE_URL,
});

const PROJECT_PAYMENT_CREATE_EVENT = "project-payment:create";

// Single payment processing task

const upper = hatchet?.workflow({
  name: "upper",
  on: {
    event: PROJECT_PAYMENT_CREATE_EVENT,
  },
});

upper?.task({
  name: "upper",
  fn: async (input, ctx) => {
    const { amount, documentId, email } = input as ProcessPaymentInput;

    console.log(`🔄 Processing payment ${documentId}...`);

    const url = `/api/payment/do-recurring-payment`;
    const data = { projectPaymentId: documentId };

    try {
      const response = await axiosClient.post(url, data, {
        headers: {
          "Content-Type": "application/json",
          "x-admin-api-key": process.env.ADMIN_API_KEY,
        },
      });

      if (response.status === 203) {
        console.log(`⏭️  Payment ${documentId}: Already processed this month`);
      } else {
        console.log(`✅ Payment ${documentId}: ${response.data.message}`);
      }

      return { message: response.data.message };
    } catch (error) {
      const errorMessage = error.response?.data?.errorMessage || error.message;
      console.error(`❌ Payment ${documentId} failed: ${errorMessage}`);

      // Don't throw - we want to continue processing other payments
      // Failed payment will be retried next month
      return { error: errorMessage };
    }
  },
});

// Main recurring payments workflow
const recurringPaymentsTask = hatchet?.workflow({
  name: "recurring-payments-monthly",
  onCrons: [
    "0 0 4 * *",  // Run at midnight UTC on the 4th (4:00 AM Armenia)
    "0 0 14 * *", // Run at midnight UTC on the 14th (4:00 AM Armenia)
    "0 0 24 * *", // Run at midnight UTC on the 24th (4:00 AM Armenia)
  ],
});

recurringPaymentsTask?.task({
  name: "process-recurring-payments",
  fn: async (input: { projectDocumentId?: string } = {}) => {
    const { projectDocumentId } = input || {};

    console.log("🔄 Running monthly recurring payments...");

    const filters: any = {
      donationType: "recurring",
    };

    if (projectDocumentId) {
      filters.documentId = projectDocumentId;
    }

    const projects = await strapiGlobal
      .documents("api::project.project")
      .findMany({
        fields: ["name"],
        filters,
        populate: {
          project_payments: {
            fields: ["documentId", "amount"],
            populate: {
              payment_method: {
                fields: ["userDocumentId"],
                populate: {
                  users_permissions_user: {
                    fields: ["email"],
                  },
                },
              },
            },
          },
        },
      });

    const results = [];

    for (const project of projects) {
      for (const projectPayment of project.project_payments) {
        const { amount, documentId } = projectPayment;
        const email = projectPayment.payment_method?.users_permissions_user?.email || "";

        const result = await hatchet.events.push(PROJECT_PAYMENT_CREATE_EVENT, {
          amount,
          documentId,
          email,
          ShouldSkip: false,
        });

        results.push(result);
      }
    }

    console.log(`✅ Queued ${results.length} recurring payments for processing`);
    return { processed: results.length };
  },
});

// Setup cron schedule and start system
export async function startRecurringPaymentSystem(strapi: Core.Strapi): Promise<boolean> {
  if (!hatchet) {
    console.log("⚠️ Hatchet not initialized (missing HATCHET_CLIENT_TOKEN) — recurring payments disabled");
    return false;
  }

  console.log(`🔄 Connecting to Hatchet (${process.env.HATCHET_CLIENT_HOST_PORT})...`);

  try {
    await hatchet.admin.putRateLimit("limit", 10, RateLimitDuration.SECOND);
    console.log("✅ Hatchet gRPC connected");
  } catch (error) {
    console.error("❌ Hatchet connection failed");
    console.error("💡 Get token at http://localhost:8888 → Settings → API Tokens");
    throw error;
  }

  strapiGlobal = strapi;

  const worker = await hatchet.worker("recurring-payments-worker", {
    workflows: [recurringPaymentsTask, upper],
  });

  worker.start();

  try {
    await recurringPaymentsTask.cron('monthly-payments-4th', '0 0 4 * *', {});
    await recurringPaymentsTask.cron('monthly-payments-14th', '0 0 14 * *', {});
    await recurringPaymentsTask.cron('monthly-payments-24th', '0 0 24 * *', {});
    console.log("✅ Recurring payments: Crons registered (4th, 14th, 24th at 00:00 UTC = 04:00 AM Armenia)");
  } catch (error) {
    if (error.message.includes("already exists")) {
      console.log("✅ Recurring payments: Crons active (4th, 14th, 24th)");
    } else {
      console.error("⚠️ Cron registration failed (manual trigger only)");
    }
  }

  return true;
}

// For manual Running
export async function triggerAllPaymentsManually(projectDocumentId?) {
  if (!hatchet || !recurringPaymentsTask) {
    throw new Error("Hatchet client not initialized. Recurring payments system is disabled.");
  }
  return await recurringPaymentsTask.runNoWait({ projectDocumentId });
}

// TODO: make sure that tasks stay in queue when no process exists
// test if it will fail if we have multiple projects
