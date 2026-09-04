import axios from "axios";
import { RateLimitDuration } from "@hatchet-dev/typescript-sdk";

import { Core } from "@strapi/strapi";
import { hatchet } from "./hatchet-client";
import { mintAdminToken } from "../src/api/payment/utils/mint-admin-token";

let strapiGlobal: Core.Strapi;
let workerGlobal: Awaited<ReturnType<NonNullable<typeof hatchet>["worker"]>> | undefined;
interface ProcessPaymentInput {
  amount: number;
  documentId: string;
  email: string;
}
const axiosClient = axios.create({
  baseURL: process.env.BASE_URL,
  timeout: 30000,
});

// Under Jest, multiple test files run as separate processes but all talk to the
// same live Hatchet server. Without a per-process suffix, they'd register the same
// worker/workflow names and Hatchet could dispatch a job from one file's test data
// to another file's (already-torn-down) process. process.pid is unique per process,
// even when Jest reuses a worker slot sequentially across files.
const TEST_SUFFIX = process.env.JEST_WORKER_ID ? `-test-${process.pid}` : "";

const PROJECT_PAYMENT_CREATE_EVENT = `project-payment:create${TEST_SUFFIX}`;

async function getSystemAdminToken(): Promise<string> {
  const userId = process.env.RECURRING_PAYMENTS_ADMIN_USER_ID;
  if (!userId) {
    throw new Error("RECURRING_PAYMENTS_ADMIN_USER_ID is not configured");
  }

  return mintAdminToken(strapiGlobal, userId);
}

// Single payment processing task

const upper = hatchet?.workflow({
  name: `upper${TEST_SUFFIX}`,
  on: {
    event: PROJECT_PAYMENT_CREATE_EVENT,
  },
});

upper?.task({
  // Cast: the SDK's .task() overload resolution depends on `name` being the
  // literal "upper" type; the runtime value is still suffixed for uniqueness.
  name: `upper${TEST_SUFFIX}` as "upper",
  fn: async (input, ctx) => {
    const { amount, documentId, email } = input as ProcessPaymentInput;

    console.log(`🔄 Processing payment ${documentId}...`);

    const url = `/api/payment/do-recurring-payment`;
    const data = { projectPaymentId: documentId };

    try {
      const adminToken = await getSystemAdminToken();
      const response = await axiosClient.post(url, data, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`,
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
  name: `recurring-payments-monthly${TEST_SUFFIX}`,
});

recurringPaymentsTask?.task({
  // Same cast rationale as the `upper` task above.
  name: `process-recurring-payments${TEST_SUFFIX}` as "process-recurring-payments",
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

  const worker = await hatchet.worker(`recurring-payments-worker${TEST_SUFFIX}`, {
    workflows: [recurringPaymentsTask, upper],
  });
  workerGlobal = worker;

  worker.start().catch(err => {
    strapiGlobal.log.error("Recurring payments worker crashed:", err);
    process.exit(1);
  });

  // Crons are time-based and irrelevant to test execution — skip registering them
  // under Jest so every test run doesn't leave behind a uniquely-suffixed orphan cron.
  if (!TEST_SUFFIX) {
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
  }

  return true;
}

// Gracefully unregisters the worker from Hatchet and waits for in-flight tasks to
// finish. Needed between test files sharing one live Hatchet instance — otherwise a
// leftover worker from a previous file keeps processing events against that file's
// already-torn-down DB connection.
export async function stopRecurringPaymentSystem(): Promise<void> {
  if (!workerGlobal) {
    return;
  }
  await workerGlobal.stop();
  workerGlobal = undefined;
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
