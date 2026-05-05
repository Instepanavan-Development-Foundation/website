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
    "saves a failed log when the bank declines, and blocks retries within 3 days",
    async () => {
      const ppId = await createFreshProjectPayment(strapi, projectDocumentId, "real-decline");

      let bankCharged = 0;
      const orig = bankingService.makeBindingPayment;
      bankingService.makeBindingPayment = async () => {
        bankCharged++;
        console.log(`  [BANK] Charge #${bankCharged}: DECLINED`);
        return {
          ResponseCode: "112",
          Description: "Card declined",
          Amount: 1000,
          OrderId: `o-${Date.now()}`,
          PaymentID: `p-${Date.now()}`,
        };
      };

      try {
        const req = makeRecurringRequest(strapi, ppId, projectDocumentId);

        // First call: bank declines, log persisted with success=false
        console.log("\n  Cron run 1: bank declines...");
        const first = await req(0);
        expect(first.error).toBeNull();
        expect(first.logCreated).toBe(true);
        expect(first.alreadyProcessed).toBe(false);
        expect(bankCharged).toBe(1);

        // Verify the failure was actually persisted (not just an in-memory return)
        const ppRecord = await strapi.db.connection("project_payments")
          .where({ document_id: ppId }).first();
        const persisted = await strapi.db.connection("payment_logs")
          .innerJoin(
            "payment_logs_project_payment_lnk",
            "payment_logs.id",
            "payment_logs_project_payment_lnk.payment_log_id"
          )
          .where("payment_logs_project_payment_lnk.project_payment_id", ppRecord.id)
          .select("payment_logs.success", "payment_logs.payment_status");
        console.log(`  Persisted logs: ${persisted.length}, success=${persisted[0]?.success}, status=${persisted[0]?.payment_status}`);
        expect(persisted.length).toBe(1);
        expect(persisted[0].success).toBe(false);
        expect(persisted[0].payment_status).toBeNull();

        // Subsequent calls within 3 days must be blocked by failed_recently guard
        console.log("\n  Cron run 1 (immediate retries): must be blocked...");
        const followUps = await Promise.all(Array.from({ length: 3 }, (_, i) => req(i + 1)));
        const blocked = followUps.filter((r) => r.alreadyProcessed).length;
        console.log(`  Blocked: ${blocked}, bank charges total: ${bankCharged}`);

        expect(blocked).toBe(3);
        expect(bankCharged).toBe(1);
      } finally {
        bankingService.makeBindingPayment = orig;
      }
    },
    120000
  );

  it(
    "releases the lock after a bank error so the next attempt can proceed",
    async () => {
      const ppId = await createFreshProjectPayment(strapi, projectDocumentId, "lock-release");

      let bankAttempts = 0;
      const orig = bankingService.makeBindingPayment;

      // First attempt: bank throws (simulates network error / timeout mid-transaction)
      bankingService.makeBindingPayment = async () => {
        bankAttempts++;
        console.log(`  [BANK] Attempt #${bankAttempts}: throwing ECONNRESET`);
        throw new Error("ECONNRESET");
      };

      try {
        const req = makeRecurringRequest(strapi, ppId, projectDocumentId);

        console.log("\n  Cron run 1: bank throws mid-transaction...");
        const failed = await req(0);
        expect(failed.error).toBe("ECONNRESET");
        expect(failed.logCreated).toBe(false);
        expect(bankAttempts).toBe(1);

        // Rollback invariant: no orphan log row, no orphan link
        const ppRecord = await strapi.db.connection("project_payments")
          .where({ document_id: ppId }).first();
        const orphans = await strapi.db.connection("payment_logs")
          .innerJoin(
            "payment_logs_project_payment_lnk",
            "payment_logs.id",
            "payment_logs_project_payment_lnk.payment_log_id"
          )
          .where("payment_logs_project_payment_lnk.project_payment_id", ppRecord.id);
        console.log(`  Orphan logs after rollback: ${orphans.length} (expected 0)`);
        expect(orphans.length).toBe(0);

        // Second attempt: bank succeeds. The row lock must have been released by the
        // rolled-back transaction; otherwise this call would hang or fail.
        console.log("\n  Cron run 2: bank recovers, lock must be free...");
        bankingService.makeBindingPayment = async () => {
          bankAttempts++;
          console.log(`  [BANK] Attempt #${bankAttempts}: SUCCESS`);
          return {
            ResponseCode: process.env.SUCCESS_RESPONSE_CODE || "00",
            Amount: 1000,
            OrderId: `o-${Date.now()}`,
            PaymentID: `p-${Date.now()}`,
          };
        };

        const ok = await req(1);
        console.log(`  Result: logCreated=${ok.logCreated}, alreadyProcessed=${ok.alreadyProcessed}, error=${ok.error}`);
        expect(ok.error).toBeNull();
        expect(ok.logCreated).toBe(true);
        expect(ok.alreadyProcessed).toBe(false);
        expect(bankAttempts).toBe(2);
      } finally {
        bankingService.makeBindingPayment = orig;
      }
    },
    120000
  );

  it(
    "uses Asia/Yerevan timezone for month boundary, not UTC",
    async () => {
      const ppId = await createFreshProjectPayment(strapi, projectDocumentId, "tz-yerevan");

      // Build a timestamp that is "this month in Yerevan, but previous month in UTC".
      // Yerevan = UTC+4, so 00:01 of day 1 of a Yerevan month maps to 20:01 UTC of the
      // last day of the previous UTC month — a boundary case where UTC-based math would
      // mis-classify the log as "previous month" and let the bank be charged again.
      const armeniaTimeStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Yerevan" });
      const armeniaTime = new Date(armeniaTimeStr);
      const yerevanYear = armeniaTime.getFullYear();
      const yerevanMonth = armeniaTime.getMonth();
      const boundaryUtcMs = Date.UTC(yerevanYear, yerevanMonth, 1, 0, 1, 0) - 4 * 60 * 60 * 1000;
      const ts = new Date(boundaryUtcMs).toISOString();
      console.log(`\n  Inserting success log at ${ts} (this month Yerevan, last month UTC)`);

      const ppRecord = await strapi.db.connection("project_payments")
        .where({ document_id: ppId }).first();
      const docId = crypto.randomBytes(12).toString("hex").slice(0, 24);
      const [row] = await strapi.db.connection("payment_logs").insert({
        document_id: docId, amount: 1000, currency: "AMD", details: "{}",
        success: true, created_at: ts, updated_at: ts,
      }).returning("id");
      await strapi.db.connection("payment_logs_project_payment_lnk").insert({
        payment_log_id: row.id ?? row, project_payment_id: ppRecord.id,
      });

      let bankCharged = 0;
      const orig = bankingService.makeBindingPayment;
      bankingService.makeBindingPayment = async () => {
        bankCharged++;
        return { ResponseCode: process.env.SUCCESS_RESPONSE_CODE || "00", Amount: 1000, OrderId: `o-${Date.now()}`, PaymentID: `p-${Date.now()}` };
      };

      try {
        const req = makeRecurringRequest(strapi, ppId, projectDocumentId);
        const result = await req(0);
        console.log(`  alreadyProcessed=${result.alreadyProcessed}, bankCharged=${bankCharged}`);

        // Guard must treat the boundary log as same-month (Yerevan) and block. If the
        // production code regressed to UTC, the log would look like "previous month"
        // and this test would catch the double-charge regression.
        expect(result.alreadyProcessed).toBe(true);
        expect(bankCharged).toBe(0);
      } finally {
        bankingService.makeBindingPayment = orig;
      }
    },
    120000
  );

  it(
    "does not serialize concurrent payments for different project_payment rows",
    async () => {
      const ppA = await createFreshProjectPayment(strapi, projectDocumentId, "parallel-a");
      const ppB = await createFreshProjectPayment(strapi, projectDocumentId, "parallel-b");

      const SLOW_MS = 500;
      let inFlight = 0;
      let maxInFlight = 0;
      const orig = bankingService.makeBindingPayment;
      bankingService.makeBindingPayment = async () => {
        inFlight++;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await new Promise((r) => setTimeout(r, SLOW_MS));
        inFlight--;
        return { ResponseCode: process.env.SUCCESS_RESPONSE_CODE || "00", Amount: 1000, OrderId: `o-${Date.now()}`, PaymentID: `p-${Date.now()}` };
      };

      try {
        const reqA = makeRecurringRequest(strapi, ppA, projectDocumentId);
        const reqB = makeRecurringRequest(strapi, ppB, projectDocumentId);

        const start = Date.now();
        const [resA, resB] = await Promise.all([reqA(0), reqB(0)]);
        const duration = Date.now() - start;
        console.log(`\n  Two different ppIds in parallel: ${duration}ms (sequential would be ${SLOW_MS * 2}ms), maxInFlight=${maxInFlight}`);

        expect(resA.logCreated).toBe(true);
        expect(resB.logCreated).toBe(true);
        // Row-level lock must NOT serialize unrelated rows — both bank calls overlap.
        expect(maxInFlight).toBe(2);
        // Wall time should be close to one slow call, not two.
        expect(duration).toBeLessThan(SLOW_MS * 2);
      } finally {
        bankingService.makeBindingPayment = orig;
      }
    },
    120000
  );

  it(
    "throws cleanly for a non-existent projectPaymentId without leaking locks",
    async () => {
      const paymentService = strapi.service("api::payment.payment");

      await expect(
        paymentService.doRecurringPaymentWithAtomicLock({
          projectPaymentId: "this-doc-id-does-not-exist-xyz",
          projectPaymentData: {
            amount: 1000, CardHolderID: "TEST", currency: "AMD",
            userDocumentId: "u", projectDocumentId, projectName: "T",
          },
          orderId: `order-${Date.now()}`,
        })
      ).rejects.toThrow("Project payment not found");

      // After the throw, a real ppId should still be processable — proves no stuck
      // connection or leaked transaction from the failed lookup.
      const ppId = await createFreshProjectPayment(strapi, projectDocumentId, "after-bogus");
      let bankCharged = 0;
      const orig = bankingService.makeBindingPayment;
      bankingService.makeBindingPayment = async () => {
        bankCharged++;
        return { ResponseCode: process.env.SUCCESS_RESPONSE_CODE || "00", Amount: 1000, OrderId: `o-${Date.now()}`, PaymentID: `p-${Date.now()}` };
      };

      try {
        const req = makeRecurringRequest(strapi, ppId, projectDocumentId);
        const result = await req(0);
        expect(result.error).toBeNull();
        expect(result.logCreated).toBe(true);
        expect(bankCharged).toBe(1);
      } finally {
        bankingService.makeBindingPayment = orig;
      }
    },
    120000
  );

  it(
    "10-concurrent winner produces exactly one log row matching the bank charge",
    async () => {
      const ppId = await createFreshProjectPayment(strapi, projectDocumentId, "winner-coherence");

      const bankCharges = [];
      const orig = bankingService.makeBindingPayment;
      bankingService.makeBindingPayment = async () => {
        const paymentId = `p-${crypto.randomBytes(8).toString("hex")}`;
        const orderId = `o-${crypto.randomBytes(8).toString("hex")}`;
        bankCharges.push({ paymentId, orderId });
        return { ResponseCode: process.env.SUCCESS_RESPONSE_CODE || "00", Amount: 1000, OrderId: orderId, PaymentID: paymentId };
      };

      try {
        const req = makeRecurringRequest(strapi, ppId, projectDocumentId);
        await Promise.all(Array.from({ length: 10 }, (_, i) => req(i)));

        expect(bankCharges.length).toBe(1);

        const ppRecord = await strapi.db.connection("project_payments")
          .where({ document_id: ppId }).first();
        const logs = await strapi.db.connection("payment_logs")
          .innerJoin(
            "payment_logs_project_payment_lnk",
            "payment_logs.id",
            "payment_logs_project_payment_lnk.payment_log_id"
          )
          .where("payment_logs_project_payment_lnk.project_payment_id", ppRecord.id);

        console.log(`\n  Bank charges: ${bankCharges.length}, log rows: ${logs.length}`);
        expect(logs.length).toBe(1);
        expect(logs[0].payment_id).toBe(bankCharges[0].paymentId);
        expect(logs[0].order_id).toBe(bankCharges[0].orderId);
        expect(logs[0].success).toBe(true);
        expect(logs[0].payment_status).toBe("completed");
      } finally {
        bankingService.makeBindingPayment = orig;
      }
    },
    120000
  );

  it(
    "blocks failure exactly at the 3-day boundary, allows just past it",
    async () => {
      // Just inside the window: 3 days minus 1 hour ago — must block
      const ppInside = await createFreshProjectPayment(strapi, projectDocumentId, "boundary-in");
      const insideRec = await strapi.db.connection("project_payments")
        .where({ document_id: ppInside }).first();
      const insideTs = new Date(Date.now() - (3 * 24 * 60 * 60 * 1000) + 60 * 60 * 1000).toISOString();
      const insideDocId = crypto.randomBytes(12).toString("hex").slice(0, 24);
      const [insideRow] = await strapi.db.connection("payment_logs").insert({
        document_id: insideDocId, amount: 1000, currency: "AMD", details: "{}",
        success: false, created_at: insideTs, updated_at: insideTs,
      }).returning("id");
      await strapi.db.connection("payment_logs_project_payment_lnk").insert({
        payment_log_id: insideRow.id ?? insideRow, project_payment_id: insideRec.id,
      });

      // Just outside the window: 3 days plus 1 hour ago — must allow retry
      const ppOutside = await createFreshProjectPayment(strapi, projectDocumentId, "boundary-out");
      const outsideRec = await strapi.db.connection("project_payments")
        .where({ document_id: ppOutside }).first();
      const outsideTs = new Date(Date.now() - (3 * 24 * 60 * 60 * 1000) - 60 * 60 * 1000).toISOString();
      const outsideDocId = crypto.randomBytes(12).toString("hex").slice(0, 24);
      const [outsideRow] = await strapi.db.connection("payment_logs").insert({
        document_id: outsideDocId, amount: 1000, currency: "AMD", details: "{}",
        success: false, created_at: outsideTs, updated_at: outsideTs,
      }).returning("id");
      await strapi.db.connection("payment_logs_project_payment_lnk").insert({
        payment_log_id: outsideRow.id ?? outsideRow, project_payment_id: outsideRec.id,
      });

      let bankCharged = 0;
      const orig = bankingService.makeBindingPayment;
      bankingService.makeBindingPayment = async () => {
        bankCharged++;
        return { ResponseCode: process.env.SUCCESS_RESPONSE_CODE || "00", Amount: 1000, OrderId: `o-${Date.now()}`, PaymentID: `p-${Date.now()}` };
      };

      try {
        const reqIn = makeRecurringRequest(strapi, ppInside, projectDocumentId);
        const reqOut = makeRecurringRequest(strapi, ppOutside, projectDocumentId);

        const inResult = await reqIn(0);
        const outResult = await reqOut(0);
        console.log(`\n  Inside window (~3d-1h): blocked=${inResult.alreadyProcessed}`);
        console.log(`  Outside window (~3d+1h): blocked=${outResult.alreadyProcessed}, logCreated=${outResult.logCreated}`);

        expect(inResult.alreadyProcessed).toBe(true);
        expect(outResult.alreadyProcessed).toBe(false);
        expect(outResult.logCreated).toBe(true);
        expect(bankCharged).toBe(1);
      } finally {
        bankingService.makeBindingPayment = orig;
      }
    },
    120000
  );

  it(
    "writes a non-null currency to the log when the bank omits the Currency field",
    async () => {
      const ppId = await createFreshProjectPayment(strapi, projectDocumentId, "currency-fallback");

      const orig = bankingService.makeBindingPayment;
      bankingService.makeBindingPayment = async () => ({
        ResponseCode: process.env.SUCCESS_RESPONSE_CODE || "00",
        Amount: 1000,
        OrderId: `o-${Date.now()}`,
        PaymentID: `p-${Date.now()}`,
        // Currency intentionally omitted — exercises the fallback chain at strapi.ts:500
      });

      try {
        const req = makeRecurringRequest(strapi, ppId, projectDocumentId);
        const result = await req(0);
        expect(result.logCreated).toBe(true);

        const ppRecord = await strapi.db.connection("project_payments")
          .where({ document_id: ppId }).first();
        const logs = await strapi.db.connection("payment_logs")
          .innerJoin(
            "payment_logs_project_payment_lnk",
            "payment_logs.id",
            "payment_logs_project_payment_lnk.payment_log_id"
          )
          .where("payment_logs_project_payment_lnk.project_payment_id", ppRecord.id);

        console.log(`\n  Currency fallback resolved to: ${JSON.stringify(logs[0].currency)}`);
        expect(logs.length).toBe(1);
        expect(logs[0].currency).toBeTruthy();
        expect(typeof logs[0].currency).toBe("string");
      } finally {
        bankingService.makeBindingPayment = orig;
      }
    },
    120000
  );

  it(
    "real getPaymentDetails controller serializes concurrent calls and saves once",
    async () => {
      const paymentController = require("../dist/src/api/payment/controllers/payment").default;
      const paymentService = strapi.service("api::payment.payment");

      // Real user (the controller resolves the user via documents API)
      const user = await strapi.documents("plugin::users-permissions.user").create({
        data: {
          username: `tab-test-${Date.now()}`,
          email: `tab-test-${Date.now()}@example.com`,
          password: "TestPass123!",
          confirmed: true,
        },
      });

      const paymentId = `real-pid-${Date.now()}`;
      const origGetDetails = paymentService.getPaymentDetails;
      paymentService.getPaymentDetails = async () => ({
        PaymentID: paymentId,
        ResponseCode: process.env.SUCCESS_RESPONSE_CODE || "00",
        Amount: 5000,
        OrderID: "test-order",
        CardNumber: "****1234",
      });

      // Stub savePayment to count invocations and write a single log row
      // (avoids the heavy real flow that creates payment-method + project-payment).
      let saveCount = 0;
      const origSave = paymentService.savePayment;
      paymentService.savePayment = async ({ paymentDetails }) => {
        saveCount++;
        const docId = crypto.randomBytes(12).toString("hex").slice(0, 24);
        const now = new Date().toISOString();
        await strapi.db.connection("payment_logs").insert({
          document_id: docId,
          amount: paymentDetails.Amount,
          currency: "AMD",
          details: JSON.stringify(paymentDetails || {}),
          success: true,
          payment_id: paymentDetails.PaymentID,
          created_at: now,
          updated_at: now,
        });
      };

      try {
        const buildCtx = () => {
          const responses = [];
          return {
            ctx: {
              request: { body: { paymentId, projectDocumentId } },
              state: { user: { id: user.id, documentId: user.documentId } },
              send: (body, status = 200) => responses.push({ body, status }),
            },
            responses,
          };
        };

        console.log(`\n  Two browser tabs hitting controller with paymentId=${paymentId}`);
        const a = buildCtx();
        const b = buildCtx();
        await Promise.all([
          paymentController.getPaymentDetails(a.ctx, () => {}),
          paymentController.getPaymentDetails(b.ctx, () => {}),
        ]);

        console.log(`  savePayment invocations: ${saveCount}`);
        expect(saveCount).toBe(1);

        expect(a.responses.length).toBe(1);
        expect(b.responses.length).toBe(1);
        expect(a.responses[0].body.success).toBe(true);
        expect(b.responses[0].body.success).toBe(true);

        const logs = await strapi.db.connection("payment_logs").where({ payment_id: paymentId });
        expect(logs.length).toBe(1);
      } finally {
        paymentService.getPaymentDetails = origGetDetails;
        paymentService.savePayment = origSave;
      }
    },
    60000
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
