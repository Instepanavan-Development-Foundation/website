import axios from "axios";
import { randomUUID } from "node:crypto";

import { Core } from "@strapi/strapi";
import { mintAdminToken } from "../src/api/payment/utils/mint-admin-token";

let strapiGlobal: Core.Strapi;
// In-process overlap guard: the run in progress, if any (a second trigger is skipped)
let currentRun: Promise<unknown> | undefined;
// Set by stopRecurringPaymentSystem() so an in-flight run stops processing new payments
// instead of holding up shutdown until every project payment is charged.
let stopping = false;
interface ProcessPaymentInput {
  amount: number;
  documentId: string;
  email: string;
}
const axiosClient = axios.create({
  baseURL: process.env.BASE_URL,
  timeout: 30000,
});

async function getSystemAdminToken(): Promise<string> {
  const userId = process.env.RECURRING_PAYMENTS_ADMIN_USER_ID;
  if (!userId) {
    throw new Error("RECURRING_PAYMENTS_ADMIN_USER_ID is not configured");
  }

  return mintAdminToken(strapiGlobal, userId);
}

// Single payment processing task

const upper = {
  fn: async (input: ProcessPaymentInput) => {
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

      return { message: response.data.message, status: response.status };
    } catch (error) {
      const errorMessage = error.response?.data?.errorMessage || error.message;
      console.error(`❌ Payment ${documentId} failed: ${errorMessage}`);

      // Don't throw - we want to continue processing other payments
      // Failed payment will be retried next month
      return { error: errorMessage };
    }
  },
};

// Main recurring payments workflow
const recurringPaymentsTask = {
  fn: async (input: { projectDocumentId?: string } = {}) => {
    const { projectDocumentId } = input || {};
    const runId = randomUUID().slice(0, 8);

    console.log(`🔄 [run ${runId}] Running monthly recurring payments...`);

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
        if (stopping) {
          throw new Error(
            `Recurring payments worker is stopping; queued ${results.length} payments before aborting`
          );
        }
        const { amount, documentId } = projectPayment;
        const email = projectPayment.payment_method?.users_permissions_user?.email || "";

        // Sequential: each payment is fully settled before the next one starts
        const result = await upper.fn({
          amount,
          documentId,
          email,
        });

        results.push(result);
      }
    }

    const succeeded = results.filter((r) => !r.error && r.status !== 203).length;
    const skipped = results.filter((r) => r.status === 203).length;
    const failed = results.filter((r) => r.error).length;
    console.log(
      `✅ [run ${runId}] Processed ${results.length} recurring payments: ` +
      `${succeeded} succeeded, ${skipped} skipped (already processed), ${failed} failed`
    );
    return { processed: results.length, succeeded, skipped, failed };
  },
};

// Runs the recurring payments task unless a run is already in progress
async function runRecurringPayments(projectDocumentId?: string) {
  if (currentRun) {
    console.log("⏭️  Recurring payments already running — skipping this trigger");
    return;
  }
  currentRun = recurringPaymentsTask.fn({ projectDocumentId });
  try {
    return await currentRun;
  } finally {
    currentRun = undefined;
  }
}

// Setup cron schedule and start system
export async function startRecurringPaymentSystem(strapi: Core.Strapi): Promise<boolean> {
  strapiGlobal = strapi;

  // Crons are time-based and irrelevant to test execution — skip registering them
  // under Jest so the test suite never fires a real recurring-payments run.
  //
  // KNOWN LIMITATION: this is an in-memory timer with no catch-up. If Strapi is down
  // at fire time or restarts mid-run, the missed payments wait for the next scheduled
  // date (the row lock in doRecurringPaymentWithAtomicLock prevents double charges).
  // See PAYMENT.md → "Run State".
  if (!process.env.JEST_WORKER_ID) {
    strapi.cron.add({
      recurringPayments: {
        // Caught so a failed run is logged instead of becoming an unhandled rejection
        task: () => runRecurringPayments().catch((error) => {
          console.error("❌ Recurring payments run failed:", error.message);
        }),
        options: { rule: "0 0 4,14,24 * *", tz: "Etc/UTC" },
      },
    });
    console.log("✅ Recurring payments: Crons registered (4th, 14th, 24th at 00:00 UTC = 04:00 AM Armenia)");
  }

  return true;
}

// Stops an in-flight run after its current payment and waits for it to finish.
// Payments call back into this Strapi instance over HTTP, so the test harness must
// call this before tearing the server and DB down.
//
// Only called explicitly (the test harness); production shutdown is unaffected.
export async function stopRecurringPaymentSystem(): Promise<void> {
  if (!currentRun) {
    return;
  }
  stopping = true;
  await currentRun.catch(() => {});
  stopping = false;
}

// For manual Running
export async function triggerAllPaymentsManually(projectDocumentId?) {
  // Fire-and-forget: a full run can take minutes
  runRecurringPayments(projectDocumentId).catch((error) => {
    console.error("❌ Recurring payments run failed:", error.message);
  });
}

// TODO: make sure that tasks stay in queue when no process exists
// test if it will fail if we have multiple projects
