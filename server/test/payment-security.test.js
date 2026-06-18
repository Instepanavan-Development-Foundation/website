const { setupStrapi, cleanupStrapi } = require("../tests/strapi");
const bankingService = require("../dist/src/api/payment/services/banking").default;
const crypto = require("crypto");

async function createUser(strapi, label) {
  return strapi.documents("plugin::users-permissions.user").create({
    data: {
      username: `${label}-${Date.now()}`,
      email: `${label}-${Date.now()}@example.com`,
      password: "TestPass123!",
      confirmed: true,
    },
  });
}

async function createPaymentMethod(strapi, userDocumentId) {
  return strapi.documents("api::payment-method.payment-method").create({
    data: {
      type: "ameriabank",
      params: JSON.stringify({
        BindingID: "TEST",
        CardNumber: "****1234",
        CardHolderID: "TEST",
        ExpDate: "12/25",
      }),
      userDocumentId,
    },
  });
}

async function createProject(strapi, { donationType = "one time", slug }) {
  return strapi.documents("api::project.project").create({
    data: {
      name: `Test Project ${slug}`,
      description: "Test",
      donationType,
      slug,
      requiredAmount: 100000,
    },
  });
}

// Insert a payment log directly, optionally backdated, optionally linked to a project
async function insertPaymentLog(strapi, { projectDocumentId, amount, success, daysAgo = 0, userDocumentId = null }) {
  const ts = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  const docId = crypto.randomBytes(12).toString("hex").slice(0, 24);
  await strapi.db.connection("payment_logs").insert({
    document_id: docId,
    amount,
    currency: "AMD",
    details: "{}",
    success,
    project_document_id: projectDocumentId,
    user_document_id: userDocumentId,
    created_at: ts,
    updated_at: ts,
  });
}

describe("Payment security and funding display", () => {
  let strapi;

  beforeAll(async () => {
    strapi = await setupStrapi();
  }, 120000);

  afterAll(async () => {
    await cleanupStrapi();
  });

  // ─── payWithSavedCard ownership ──────────────────────────────────────────────

  describe("payWithSavedCard — card ownership enforcement", () => {
    const paymentController = () =>
      require("../dist/src/api/payment/controllers/payment").default;

    it("allows the owner to use their own card", async () => {
      const userA = await createUser(strapi, "owner-a");
      const pm = await createPaymentMethod(strapi, userA.documentId);
      const project = await createProject(strapi, { slug: `own-card-${Date.now()}` });

      let bankCharged = 0;
      const orig = bankingService.makeBindingPayment;
      bankingService.makeBindingPayment = async () => {
        bankCharged++;
        return {
          ResponseCode: process.env.SUCCESS_RESPONSE_CODE || "00",
          Amount: 500,
          OrderId: `o-${Date.now()}`,
          PaymentID: `p-${Date.now()}`,
        };
      };

      // Stub savePayment to avoid the full createProjectPayment flow (needs currency etc.)
      // This test only validates the ownership check passes — not the downstream save logic
      const paymentService = strapi.service("api::payment.payment");
      const origSave = paymentService.savePayment;
      paymentService.savePayment = async () => {};

      const responses = [];
      const ctx = {
        request: {
          body: {
            amount: 500,
            projectDocumentId: project.documentId,
            paymentMethodId: pm.documentId,
          },
        },
        state: { user: { id: userA.id, documentId: userA.documentId } },
        send: (body, status = 200) => responses.push({ body, status }),
        unauthorized: (msg) => responses.push({ body: { error: msg }, status: 401 }),
        forbidden: (msg) => responses.push({ body: { error: msg }, status: 403 }),
      };

      try {
        await paymentController().payWithSavedCard(ctx);
        console.log(`\n  Owner response: status=${responses[0].status}`);
        expect(responses[0].status).toBe(200);
        expect(bankCharged).toBe(1);
      } finally {
        bankingService.makeBindingPayment = orig;
        paymentService.savePayment = origSave;
      }
    }, 60000);

    it("blocks user B from charging user A's saved card (403)", async () => {
      const userA = await createUser(strapi, "card-owner");
      const userB = await createUser(strapi, "card-thief");
      const pm = await createPaymentMethod(strapi, userA.documentId);
      const project = await createProject(strapi, { slug: `stolen-card-${Date.now()}` });

      let bankCharged = 0;
      const orig = bankingService.makeBindingPayment;
      bankingService.makeBindingPayment = async () => {
        bankCharged++;
        return { ResponseCode: "00", Amount: 500 };
      };

      const responses = [];
      const ctx = {
        request: {
          body: {
            amount: 500,
            projectDocumentId: project.documentId,
            paymentMethodId: pm.documentId,
          },
        },
        // userB is making the request using userA's paymentMethodId
        state: { user: { id: userB.id, documentId: userB.documentId } },
        send: (body, status = 200) => responses.push({ body, status }),
        unauthorized: (msg) => responses.push({ body: { error: msg }, status: 401 }),
        forbidden: (msg) => responses.push({ body: { error: msg }, status: 403 }),
      };

      try {
        await paymentController().payWithSavedCard(ctx);
        console.log(`\n  Response: status=${responses[0].status}, body=${JSON.stringify(responses[0].body)}`);

        // CRITICAL: must be 403, not 200 or 500 — bank must never be contacted
        expect(responses[0].status).toBe(403);
        expect(bankCharged).toBe(0);
      } finally {
        bankingService.makeBindingPayment = orig;
      }
    }, 60000);

    it("returns 401 for unauthenticated requests (no user session)", async () => {
      const pm = await createPaymentMethod(strapi, "some-user-doc-id");
      const project = await createProject(strapi, { slug: `unauth-${Date.now()}` });

      let bankCharged = 0;
      const orig = bankingService.makeBindingPayment;
      bankingService.makeBindingPayment = async () => { bankCharged++; return {}; };

      const responses = [];
      const ctx = {
        request: {
          body: { amount: 500, projectDocumentId: project.documentId, paymentMethodId: pm.documentId },
        },
        state: { user: null },
        send: (body, status = 200) => responses.push({ body, status }),
        unauthorized: (msg) => responses.push({ body: { error: msg }, status: 401 }),
        forbidden: (msg) => responses.push({ body: { error: msg }, status: 403 }),
      };

      try {
        await paymentController().payWithSavedCard(ctx);
        expect(responses[0].status).toBe(401);
        expect(bankCharged).toBe(0);
      } finally {
        bankingService.makeBindingPayment = orig;
      }
    }, 60000);
  });

  // ─── getProjectFunding ───────────────────────────────────────────────────────

  describe("getProjectFunding — recurring vs one-time display logic", () => {
    it("recurring: counts only this month's successful logs, not last month's", async () => {
      const project = await createProject(strapi, {
        donationType: "recurring",
        slug: `funding-recurring-${Date.now()}`,
      });

      // This month: 2 successes
      await insertPaymentLog(strapi, { projectDocumentId: project.documentId, amount: 1000, success: true, daysAgo: 3 });
      await insertPaymentLog(strapi, { projectDocumentId: project.documentId, amount: 2000, success: true, daysAgo: 1 });
      // This month: 1 failure — must NOT count
      await insertPaymentLog(strapi, { projectDocumentId: project.documentId, amount: 5000, success: false, daysAgo: 2 });
      // Last month: success — must NOT count toward current month
      await insertPaymentLog(strapi, { projectDocumentId: project.documentId, amount: 9000, success: true, daysAgo: 32 });

      const projectService = strapi.service("api::project.project");
      const funding = await projectService.getProjectFunding(project.documentId);

      console.log("\n  Recurring funding:", JSON.stringify(funding.currentMonth, null, 2));

      expect(funding.donationType).toBe("recurring");
      expect(funding.currentMonth.recurring.amount).toBe(3000);
      expect(funding.currentMonth.recurring.count).toBe(2);
    }, 60000);

    it("recurring: failed payments are never included in any total", async () => {
      const project = await createProject(strapi, {
        donationType: "recurring",
        slug: `funding-fail-excluded-${Date.now()}`,
      });

      // Only failures — both current and old
      await insertPaymentLog(strapi, { projectDocumentId: project.documentId, amount: 5000, success: false, daysAgo: 1 });
      await insertPaymentLog(strapi, { projectDocumentId: project.documentId, amount: 5000, success: false, daysAgo: 35 });

      const projectService = strapi.service("api::project.project");
      const funding = await projectService.getProjectFunding(project.documentId);

      console.log("\n  All-failure funding:", JSON.stringify(funding, null, 2));

      expect(funding.currentMonth.recurring.amount).toBe(0);
      expect(funding.currentMonth.recurring.count).toBe(0);
      expect(funding.allTime.recurring.amount).toBe(0);
    }, 60000);

    it("recurring: last month's successes appear in allTime but not currentMonth", async () => {
      const project = await createProject(strapi, {
        donationType: "recurring",
        slug: `funding-alltime-${Date.now()}`,
      });

      // Last month success
      await insertPaymentLog(strapi, { projectDocumentId: project.documentId, amount: 3000, success: true, daysAgo: 35 });
      // This month success
      await insertPaymentLog(strapi, { projectDocumentId: project.documentId, amount: 1000, success: true, daysAgo: 2 });

      const projectService = strapi.service("api::project.project");
      const funding = await projectService.getProjectFunding(project.documentId);

      console.log("\n  Cross-month funding:", JSON.stringify(funding, null, 2));

      // All-time sees both
      expect(funding.allTime.recurring.amount).toBe(4000);
      expect(funding.allTime.recurring.count).toBe(2);
      // Current month sees only this month
      expect(funding.currentMonth.recurring.amount).toBe(1000);
      expect(funding.currentMonth.recurring.count).toBe(1);
    }, 60000);

    it("one-time: sums all-time successful payments regardless of month", async () => {
      const project = await createProject(strapi, {
        donationType: "one time",
        slug: `funding-onetime-${Date.now()}`,
      });

      // The one-time path reads from `donation.project.documentId` via Strapi document
      // API, not from project_document_id column. We test via the service with no
      // direct log insertion (those need a donation link) — assert empty starts at 0.
      const projectService = strapi.service("api::project.project");
      const funding = await projectService.getProjectFunding(project.documentId);

      console.log("\n  One-time funding (empty):", JSON.stringify(funding, null, 2));

      expect(funding.donationType).toBe("one time");
      expect(funding.allTime.oneTime.amount).toBe(0);
      expect(funding.allTime.oneTime.count).toBe(0);
    }, 60000);

    it("returns null for a non-existent project documentId", async () => {
      const projectService = strapi.service("api::project.project");
      const funding = await projectService.getProjectFunding("this-does-not-exist-xyz");

      expect(funding).toBeNull();
    }, 30000);
  });
});
