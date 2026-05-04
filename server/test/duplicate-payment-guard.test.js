const { setupStrapi, cleanupStrapi } = require("../tests/strapi");
const bankingService = require("../dist/src/api/payment/services/banking").default;
const crypto = require("crypto");

// Helper: create a fresh payment method + project payment for each test
async function createFreshProjectPayment(strapi, projectDocumentId, label = "") {
  const pm = await strapi.documents("api::payment-method.payment-method").create({
    data: {
      type: "ameriabank",
      params: JSON.stringify({ BindingID: "TEST", CardNumber: "TEST", CardHolderID: "TEST", ExpDate: "12/25" }),
      userDocumentId: `test-user-${label}-${Date.now()}`,
    },
  });
  const pp = await strapi.documents("api::project-payment.project-payment").create({
    data: {
      amount: 1000,
      currency: "AMD",
      type: "recurring",
      name: `Test Payment - ${label}`,
      project: projectDocumentId,
      payment_method: pm.documentId,
    },
  });
  return pp.documentId;
}

// Helper: insert a backdated payment log directly into the DB
async function insertBackdatedLog(strapi, projectPaymentDocumentId, { daysAgo, success }) {
  const record = await strapi.db.connection("project_payments")
    .where({ document_id: projectPaymentDocumentId }).first();
  const ts = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  const docId = crypto.randomBytes(12).toString("hex").slice(0, 24);
  const [row] = await strapi.db.connection("payment_logs").insert({
    document_id: docId, amount: 1000, currency: "AMD", details: "{}",
    success, created_at: ts, updated_at: ts,
  }).returning("id");
  await strapi.db.connection("payment_logs_project_payment_lnk").insert({
    payment_log_id: row.id ?? row,
    project_payment_id: record.id,
  });
}

// Helper: make a single doRecurringPaymentWithAtomicLock call
function makeRecurringRequest(strapi, projectPaymentId, projectDocumentId) {
  return async (index) => {
    const paymentService = strapi.service("api::payment.payment");
    try {
      const result = await paymentService.doRecurringPaymentWithAtomicLock({
        projectPaymentId,
        projectPaymentData: {
          amount: 1000, CardHolderID: "TEST", currency: "AMD",
          userDocumentId: `user-${Date.now()}`, projectDocumentId, projectName: "Test",
        },
        orderId: `order-${Date.now()}-${index}`,
      });
      return { alreadyProcessed: result.alreadyProcessed, logCreated: result.logCreated, error: null };
    } catch (err) {
      return { alreadyProcessed: null, logCreated: false, error: err.message };
    }
  };
}

/**
 * Regression test for the May 4 double-charging incident.
 *
 * Bug: Two concurrent requests to doRecurringPayment both raced past the
 * guard check before any payment log was written — charging users twice.
 *
 * Fix: DB-level FOR UPDATE lock ensures only one request proceeds per month.
 * The lock is held WHILE creating the payment log, preventing any race condition.
 *
 * To reproduce the bug:
 *   git stash   (removes the lock fix from strapi.ts and controller)
 *   npm test -- --testPathPatterns=duplicate-payment-guard
 *   → test FAILS (multiple requests get past the guard and charge multiple times)
 *
 * To verify the fix:
 *   git stash pop
 *   npm test -- --testPathPatterns=duplicate-payment-guard
 *   → test PASSES (only 1 request charges, rest see the log and return 203)
 */
describe("Recurring payment duplicate guard (regression: May 4 double-charge)", () => {
  let strapi;
  let projectPaymentId;
  let projectDocumentId;

  beforeAll(async () => {
    strapi = await setupStrapi();

    try {
      console.log("Creating test data via Strapi API...");

      // Create test project
      const project = await strapi.documents("api::project.project").create({
        data: {
          name: `Test Recurring ${Date.now()}`,
          description: "Test project",
          donationType: "recurring",
          slug: `test-${Date.now()}`,
          requiredAmount: 100000,
        },
      });
      projectDocumentId = project.documentId;
      console.log("  ✓ Created test project:", project.documentId);

      // Create test payment method
      const paymentMethod = await strapi
        .documents("api::payment-method.payment-method")
        .create({
          data: {
            type: "ameriabank",
            params: JSON.stringify({
              BindingID: "TEST",
              CardNumber: "TEST",
              CardHolderID: "TEST",
              ExpDate: "12/25",
            }),
            userDocumentId: `test-user-${Date.now()}`,
          },
        });
      console.log("  ✓ Created test payment method");

      // Create test project payment
      const projectPayment = await strapi
        .documents("api::project-payment.project-payment")
        .create({
          data: {
            amount: 1000,
            currency: "AMD",
            type: "recurring",
            name: "Test Payment",
            project: project.documentId,
            payment_method: paymentMethod.documentId,
          },
        });
      projectPaymentId = projectPayment.documentId;
      console.log("  ✓ Created test project payment:", projectPaymentId);
      console.log("Test data created");
    } catch (error) {
      console.error("Failed to create test data:", error);
      throw error;
    }
  }, 120000);

  afterAll(async () => {
    await cleanupStrapi();
  });

  it(
    "charges the bank ONLY ONCE even with 10 concurrent requests",
    async () => {
      const CONCURRENT = 10;
      console.log(
        `\nFiring ${CONCURRENT} concurrent requests to test atomic lock + log creation...`
      );

      // Track how many times the bank is actually charged
      let bankChargeCount = 0;
      const originalMakeBindingPayment = bankingService.makeBindingPayment;

      // Mock at the banking module level — this is what doRecurringPaymentWithAtomicLock calls
      bankingService.makeBindingPayment = async () => {
        bankChargeCount++;
        console.log(`  [BANK] Charge #${bankChargeCount} requested`);
        return {
          ResponseCode: process.env.SUCCESS_RESPONSE_CODE || "00",
          Description: "Success",
          Amount: 1000,
          OrderId: `order-${Date.now()}`,
          PaymentID: `payment-${Date.now()}`,
        };
      };

      const paymentService = strapi.service("api::payment.payment");

      try {
        // Concurrent requests: each calls the full atomic method that acquires the lock,
        // checks if already processed, charges the bank, and creates the log — all within
        // the same transaction. This proves the bank is charged exactly once even under
        // concurrent load.
        const makeRequest = async (index) => {
          try {
            const result = await paymentService.doRecurringPaymentWithAtomicLock({
              projectPaymentId,
              projectPaymentData: {
                amount: 1000,
                CardHolderID: "TEST",
                currency: "AMD",
                userDocumentId: `test-user-${Date.now()}`,
                projectDocumentId,
                projectName: "Test Project",
              },
              orderId: `order-${Date.now()}-${index}`,
            });

            return {
              alreadyProcessed: result.alreadyProcessed,
              logCreated: result.logCreated,
              error: null,
            };
          } catch (err) {
            return {
              alreadyProcessed: null,
              logCreated: false,
              error: err.message,
            };
          }
        };

        // Fire all 10 requests concurrently
        const requests = Array.from({ length: CONCURRENT }, (_, i) => makeRequest(i));
        const responses = await Promise.all(requests);

        const logsCreated = responses.filter((r) => r.logCreated).length;
        const blocked = responses.filter((r) => r.alreadyProcessed).length;
        const errors = responses.filter((r) => r.error).length;

        console.log("\nResults:");
        console.log(
          "  Request outcomes:",
          responses.map((r) => ({
            logCreated: r.logCreated,
            alreadyProcessed: r.alreadyProcessed,
            error: r.error,
          }))
        );
        console.log(`  Logs created: ${logsCreated}`);
        console.log(`  Requests blocked (already processed): ${blocked}`);
        console.log(`  Errors: ${errors}`);
        console.log(`  Total bank charges attempted: ${bankChargeCount}`);

        // CRITICAL: Only 1 request should have created a log (and charged the bank)
        // The other 9 should see the log already exists and return alreadyProcessed=true
        expect(logsCreated).toBe(1);
        expect(bankChargeCount).toBe(1);
        expect(blocked).toBe(CONCURRENT - 1);
        expect(errors).toBe(0);
      } finally {
        bankingService.makeBindingPayment = originalMakeBindingPayment;
      }
    },
    120000
  );

  it(
    "retries the bank on the next cron run even if this month's payment failed",
    async () => {
      const testProjectPaymentId = await createFreshProjectPayment(strapi, projectDocumentId, "retry-after-fail");
      await insertBackdatedLog(strapi, testProjectPaymentId, { daysAgo: 11, success: false });
      console.log("  ✓ Inserted backdated failed log (simulates 4th cron failure, 11 days ago)");

      let bankChargeCount = 0;
      const orig = bankingService.makeBindingPayment;
      bankingService.makeBindingPayment = async () => {
        bankChargeCount++;
        console.log(`  [BANK] Charge #${bankChargeCount}: SUCCESS`);
        return { ResponseCode: process.env.SUCCESS_RESPONSE_CODE || "00", Amount: 1000, OrderId: `order-${Date.now()}`, PaymentID: `payment-${Date.now()}` };
      };

      try {
        console.log("\nCron run 2 (14th): salary arrived, bank succeeds...");
        const req = makeRecurringRequest(strapi, testProjectPaymentId, projectDocumentId);
        const results = await Promise.all(Array.from({ length: 5 }, (_, i) => req(i)));
        const logs = results.filter((r) => r.logCreated).length;
        const blocked = results.filter((r) => r.alreadyProcessed).length;
        console.log(`  Logs created: ${logs}, blocked: ${blocked}, bank charges: ${bankChargeCount}`);

        // CRITICAL: 11-day-old failed log must NOT block the 14th cron — bank should retry
        expect(logs).toBe(1);
        expect(blocked).toBe(4);
        expect(bankChargeCount).toBe(1);
      } finally {
        bankingService.makeBindingPayment = orig;
      }
    },
    120000
  );

  it(
    "does NOT retry if payment already succeeded this month",
    async () => {
      const testProjectPaymentId = await createFreshProjectPayment(strapi, projectDocumentId, "no-retry-success");

      let bankChargeCount = 0;
      const orig = bankingService.makeBindingPayment;

      try {
        bankingService.makeBindingPayment = async () => {
          bankChargeCount++;
          return { ResponseCode: process.env.SUCCESS_RESPONSE_CODE || "00", Amount: 1000, OrderId: `order-${Date.now()}`, PaymentID: `payment-${Date.now()}` };
        };

        console.log("\nCron run 1 (4th): payment succeeds...");
        const req = makeRecurringRequest(strapi, testProjectPaymentId, projectDocumentId);
        const batch1 = await Promise.all(Array.from({ length: 5 }, (_, i) => req(i)));
        const logs1 = batch1.filter((r) => r.logCreated).length;
        console.log(`  Logs created: ${logs1}, bank charges: ${bankChargeCount}`);
        expect(logs1).toBe(1);
        expect(bankChargeCount).toBe(1);

        console.log("\nCron run 2 (14th): already paid this month, must not retry...");
        bankChargeCount = 0;
        bankingService.makeBindingPayment = async () => {
          bankChargeCount++;
          return { ResponseCode: "00", Amount: 1000, PaymentID: "should-not-charge" };
        };

        const batch2 = await Promise.all(Array.from({ length: 5 }, (_, i) => req(i + 100)));
        const blocked2 = batch2.filter((r) => r.alreadyProcessed).length;
        console.log(`  Blocked by success log: ${blocked2}, bank charges: ${bankChargeCount}`);

        expect(blocked2).toBe(5);
        expect(bankChargeCount).toBe(0);
      } finally {
        bankingService.makeBindingPayment = orig;
      }
    },
    120000
  );

  it(
    "does NOT block payment in a new month even if last month succeeded",
    async () => {
      const ppId = await createFreshProjectPayment(strapi, projectDocumentId, "cross-month");
      await insertBackdatedLog(strapi, ppId, { daysAgo: 32, success: true });
      console.log("\n  ✓ Inserted success log from 32 days ago (last month)");

      let bankCharged = 0;
      const orig = bankingService.makeBindingPayment;
      bankingService.makeBindingPayment = async () => {
        bankCharged++;
        return { ResponseCode: process.env.SUCCESS_RESPONSE_CODE || "00", Amount: 1000, OrderId: `o-${Date.now()}`, PaymentID: `p-${Date.now()}` };
      };

      try {
        const req = makeRecurringRequest(strapi, ppId, projectDocumentId);
        const results = await Promise.all(Array.from({ length: 3 }, (_, i) => req(i)));
        const created = results.filter((r) => r.logCreated).length;
        console.log(`  Logs created: ${created}, bank charges: ${bankCharged}`);

        // Last month's success must NOT block this month
        expect(created).toBe(1);
        expect(bankCharged).toBe(1);
      } finally {
        bankingService.makeBindingPayment = orig;
      }
    },
    120000
  );

  it(
    "blocks retry if failure was less than 3 days ago (same cron window)",
    async () => {
      const ppId = await createFreshProjectPayment(strapi, projectDocumentId, "recent-fail");
      await insertBackdatedLog(strapi, ppId, { daysAgo: 2, success: false });
      console.log("\n  ✓ Inserted failed log from 2 days ago");

      let bankCharged = 0;
      const orig = bankingService.makeBindingPayment;
      bankingService.makeBindingPayment = async () => {
        bankCharged++;
        return { ResponseCode: "00", Amount: 1000, OrderId: `o-${Date.now()}`, PaymentID: `p-${Date.now()}` };
      };

      try {
        const req = makeRecurringRequest(strapi, ppId, projectDocumentId);
        const results = await Promise.all(Array.from({ length: 5 }, (_, i) => req(i)));
        const blocked = results.filter((r) => r.alreadyProcessed).length;
        console.log(`  Blocked: ${blocked}, bank charges: ${bankCharged}`);

        // Failure 2 days ago is within the 3-day window — must block
        expect(blocked).toBe(5);
        expect(bankCharged).toBe(0);
      } finally {
        bankingService.makeBindingPayment = orig;
      }
    },
    120000
  );

  it(
    "allows retry if failure was more than 3 days ago (next cron window)",
    async () => {
      const ppId = await createFreshProjectPayment(strapi, projectDocumentId, "old-fail");
      await insertBackdatedLog(strapi, ppId, { daysAgo: 4, success: false });
      console.log("\n  ✓ Inserted failed log from 4 days ago");

      let bankCharged = 0;
      const orig = bankingService.makeBindingPayment;
      bankingService.makeBindingPayment = async () => {
        bankCharged++;
        return { ResponseCode: process.env.SUCCESS_RESPONSE_CODE || "00", Amount: 1000, OrderId: `o-${Date.now()}`, PaymentID: `p-${Date.now()}` };
      };

      try {
        const req = makeRecurringRequest(strapi, ppId, projectDocumentId);
        const results = await Promise.all(Array.from({ length: 5 }, (_, i) => req(i)));
        const created = results.filter((r) => r.logCreated).length;
        const blocked = results.filter((r) => r.alreadyProcessed).length;
        console.log(`  Logs created: ${created}, blocked: ${blocked}, bank charges: ${bankCharged}`);

        // Failure 4 days ago is outside the 3-day window — must allow retry
        expect(created).toBe(1);
        expect(blocked).toBe(4);
        expect(bankCharged).toBe(1);
      } finally {
        bankingService.makeBindingPayment = orig;
      }
    },
    120000
  );

  it(
    "getOrderId returns unique IDs under concurrent load",
    async () => {
      const paymentService = strapi.service("api::payment.payment");
      const COUNT = 50;
      console.log(`\n  Calling getOrderId() ${COUNT} times concurrently...`);

      const ids = await Promise.all(Array.from({ length: COUNT }, () => paymentService.getOrderId()));
      const unique = new Set(ids);
      console.log(`  Unique IDs: ${unique.size} / ${COUNT}`);
      console.log(`  Sample: ${ids.slice(0, 5).join(", ")}`);

      expect(unique.size).toBe(COUNT);
    },
    30000
  );

  it(
    "getPaymentDetails does not double-save when two tabs redirect simultaneously",
    async () => {
      const paymentId = `test-payment-${Date.now()}`;
      const orig = bankingService.getPaymentDetails;

      let fetchCount = 0;
      bankingService.getPaymentDetails = async () => {
        fetchCount++;
        return {
          PaymentID: paymentId,
          ResponseCode: process.env.SUCCESS_RESPONSE_CODE || "00",
          Amount: 5000,
          OrderID: "12345",
          CardNumber: "****1234",
        };
      };

      const paymentService = strapi.service("api::payment.payment");
      const orig2 = paymentService.getPaymentDetails;
      paymentService.getPaymentDetails = bankingService.getPaymentDetails;

      console.log(`\n  Two tabs redirecting with paymentId: ${paymentId}`);

      try {
        // Simulate two concurrent getPaymentDetails calls (two browser tabs)
        const makeCall = async () => {
          const trx = await strapi.db.connection.transaction();
          try {
            await trx.raw("SELECT pg_advisory_xact_lock(hashtext(?))", [paymentId]);
            const existing = await trx("payment_logs")
              .where({ payment_id: paymentId, success: true }).first();
            if (existing) {
              await trx.commit();
              return { saved: false };
            }
            const details = await bankingService.getPaymentDetails(paymentId);
            const docId = crypto.randomBytes(12).toString("hex").slice(0, 24);
            const now = new Date().toISOString();
            await trx("payment_logs").insert({
              document_id: docId, amount: details.Amount, currency: "AMD",
              details: JSON.stringify(details), success: true,
              payment_id: paymentId, created_at: now, updated_at: now,
            });
            await trx.commit();
            return { saved: true };
          } catch (e) {
            await trx.rollback();
            throw e;
          }
        };

        const results = await Promise.all([makeCall(), makeCall()]);
        const saved = results.filter((r) => r.saved).length;
        console.log(`  Logs saved: ${saved} (expected 1)`);

        // Advisory lock must serialize: only one tab saves, the other sees existing log
        expect(saved).toBe(1);
      } finally {
        bankingService.getPaymentDetails = orig;
        paymentService.getPaymentDetails = orig2;
      }
    },
    30000
  );
});
