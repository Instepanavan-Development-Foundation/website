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
    //TODO: make sure that the request is authenticated and can be run by the admin only
    const response = await axiosClient.post(url, data, {
      headers: { "Content-Type": "application/json" },
    });

    console.log(`✅ Payment ${documentId}: ${response.data.message}`);
    return { message: response.data.message };
  },
});

// Main recurring payments workflow
const recurringPaymentsTask = hatchet?.workflow({
  name: "recurring-payments-monthly",
  onCrons: ["0 0 4 * *"], // Run at midnight on the 4th of every month (UTC)
});

recurringPaymentsTask?.task({
  name: "process-recurring-payments",
  fn: async (input: { projectDocumentId?: string }) => {
    const { projectDocumentId } = input;

    console.log("🔄 Running monthly recurring payments...");

    const filters: any = {
      donationType: "recurring",
    };

    if (projectDocumentId) {
      filters.documentId = projectDocumentId;
    }

    //TODO: Add email or user to projectPayment so we can log it and associate with an account
    const projects = await strapiGlobal
      .documents("api::project.project")
      .findMany({
        fields: ["name"],
        filters,
        populate: {
          project_payments: {
            fields: ["id", "amount"],
          },
        },
      });

    const results = [];

    for (const project of projects) {
      for (const projectPayment of project.project_payments) {
        const { amount, documentId } = projectPayment;

        const result = await hatchet.events.push(PROJECT_PAYMENT_CREATE_EVENT, {
          amount,
          documentId,
          email: "TODO: dummy EMAIL ADD LATER",
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
export async function startRecurringPaymentSystem(strapi: Core.Strapi) {
  if (!hatchet) {
    console.log("⚠️ Hatchet not initialized (missing HATCHET_CLIENT_TOKEN)");
    return;
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
    await recurringPaymentsTask.cron('monthly-payments', '0 0 4 * *', {});
    console.log("✅ Recurring payments: Monthly cron registered (0 0 4 * *)");
  } catch (error) {
    if (error.message.includes("already exists")) {
      console.log("✅ Recurring payments: Monthly cron active (4th of month)");
    } else {
      console.error("⚠️ Cron registration failed (manual trigger only)");
    }
  }
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
