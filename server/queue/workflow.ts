import axios from "axios";
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

// Single payment processing task
const processPaymentTask = hatchet.task({
  name: "process-single-payment",
  fn: async (input, ctx) => {
    const { amount, documentId, email } = input as ProcessPaymentInput;

    console.log(`Processing payment: ${documentId}`);

    const url = `/api/payment/do-recurring-payment`;
    const data = { projectPaymentId: documentId };
    //TODO: make sure that the request is authenticated and can be run by the admin only
    const response = await axiosClient.post(url, data, {
      headers: { "Content-Type": "application/json" },
    });

    // Update record (abstract call)

    console.log("response data: ", response.data)

    const message = `Processing payment ${documentId} with message: ${response.data.message} for amount ${amount}, with status ${response.status}`;
    console.log(message);
    return { message };
  },
});

// Main recurring payments task for day X
const recurringPaymentsTask = hatchet.task({
  name: "recurring-payments-monthly",
  fn: async () => {
    console.log(`Running monthly recurring payments`);

    //TODO: Add email or user to projectPayment so we can log it and associate with an account
    const projects = await strapiGlobal
      .documents("api::project.project")
      .findMany({
        fields: ["name"],
        filters: {
          donationType: "recurring",
        },
        populate: {
          project_payments: {
            fields: ["id", "amount"],
          },
        },
      });
    const results = [];

    for (const project of projects) {
      console.log(
        "Processing project payment for:" +
          project.name +
          ":" +
          project.documentId
      );

      for (const projectPayment of project.project_payments) {
        const { amount, documentId } = projectPayment;
        const result = await processPaymentTask.run({
          amount,
          documentId,
          email: "TODO: dummy EMAIL ADD LATER",
        });

        results.push(result);
      }
    }

    console.log(`Found ${results.length} payments to process`);

    // Process each payment one by one (sequential processing)
    console.log(`Processed ${results.length} payments for day ${new Date()}`);
    return { processed: results.length };
  },
});

// Setup cron schedule and start system
export async function startRecurringPaymentSystem(strapi: Core.Strapi) {
  strapiGlobal = strapi;
  const cronSchedule = "* * * * *";
  // Create worker with tasks
  const worker = await hatchet.worker("recurring-payments-worker", {
    workflows: [processPaymentTask, recurringPaymentsTask],
  });

  // Try to delete existing cron first (if it exists)
  try {
    // TODO: make sure that we don't delete logs from hatchet otherwise we will need to register just those we didn't register before
    const cronList = await hatchet.crons.list({
      offset: 0,
      limit: 10,
    });

    if (!cronList.rows.length) {
      console.log(`ℹ️ No existing cron to delete`);
    }

    for (const row of cronList.rows) {
      await hatchet.crons.delete(row);
      console.log(`🗑️ Deleted existing cron: ${row.name}`);
    }
  } catch (error) {
    // Ignore if cron doesn't exist
    console.log(`Can't delete a cron`, error);
  }

  await recurringPaymentsTask.cron(
    `monthly-payments ${cronSchedule}`,
    cronSchedule,
    {} // Empty input since the task doesn't need input
  );

  // Start the worker
  await worker.start();

  console.log("Hatchet recurring payment system started");
  console.log(`Scheduled cron job: ${cronSchedule}`);
}

// For manual testing
export async function triggerAllPaymentsManually(projectDocumentId?) {
  await recurringPaymentsTask.run({});
}
