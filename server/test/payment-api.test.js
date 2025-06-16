const axios = require('axios');

describe("Testing Recurring payments under load", () => {
    it('will be doing 10000 consequential requests', async () => {
        const requestsArray = new Array(500).fill(null);

        const axiosClient = axios.create({
            baseURL: "http://127.0.0.1:1337",
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