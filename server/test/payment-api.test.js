const axios = require('axios');
const { setupStrapi, cleanupStrapi } = require("../tests/strapi");
const { mintAdminToken } = require("../dist/src/api/payment/utils/mint-admin-token");

describe("Testing Recurring payments under load", () => {
    let strapi, adminToken;

    beforeAll(async () => {
        strapi = await setupStrapi();
        const adminUser = await strapi.db.query('admin::user').findOne({ where: { isActive: true } });
        if (!adminUser) {
            throw new Error("No active admin::user found — create one before running this test");
        }
        adminToken = await mintAdminToken(strapi, adminUser.id);
    }, 120000);

    afterAll(async () => {
        await cleanupStrapi();
    });

    it('will be doing 10000 consequential requests', async () => {
        const requestsArray = new Array(500).fill(null);

        const axiosClient = axios.create({
            baseURL: "http://127.0.0.1:1337",
            headers: { Authorization: `Bearer ${adminToken}` },
        });

        const responseAll = [];
        for (const request of requestsArray) {
            responseAll.push(axiosClient.post('/api/payment/trigger-all-payments', {}));
        }

        const responses = await Promise.all(responseAll);
        const successStatuses = responses.every(({ status }) => status >= 200 && status <= 203);
        expect(successStatuses).toBe(true);
    }, 60000 * 1000);
});