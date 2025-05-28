import axios from "axios";
import { hatchet } from "./hatchet-client";
interface RecurringPayment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  paymentMethodId: string;
  dayOfMonth: number;
}

interface ProcessPaymentInput {
  amount: number;
  documentId: string;
  email: string;
}

// Abstract function calls - implement these elsewhere
declare function getRecurringPayments(
  dayOfMonth: number
): Promise<RecurringPayment[]>;
declare function processPayment(paymentData: RecurringPayment): Promise<any>;
declare function updatePaymentRecord(
  documentId: string,
  result: any
): Promise<void>;

// Single payment processing task
const processPaymentTask = hatchet.task({
  name: "process-single-payment",
  fn: async (input, ctx) => {
    const { amount, documentId, email } = input as ProcessPaymentInput;

    console.log(`Processing payment: ${documentId}`);

    const url = `${process.env.BASE_URL}/api/payment/do-recurring-payment`;
    const data = { projectPaymentId: documentId };

    const response = await axios.post(url, data);

    // Update record (abstract call)
    await updatePaymentRecord(documentId, response);

    const message = `Processing payment ${documentId} with message: ${response.data.body.message} for amount ${amount}, with status ${response.status}`;
    console.log(message);
    return { message };
  },
});

// Main recurring payments task for day 2
const recurringPaymentsTask = hatchet.task({
  name: "recurring-payments-monthly",
  fn: async () => {
    console.log(`Running monthly recurring payments`);

    //TODO: Add email or user to projectPayment so we can log it and associate with an account
    const projects = await strapi.documents("api::project.project").findMany({
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
          email: "dummy EMAIL ADD LATER",
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
export async function startRecurringPaymentSystem() {
  const cronSchedule = "0 9 2 * *";
  // Create worker with tasks
  const worker = await hatchet.worker("recurring-payments-worker", {
    workflows: [processPaymentTask, recurringPaymentsTask],
  });

  await recurringPaymentsTask.cron(
    "monthly-payments",
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
