import { HatchetClient } from "@hatchet-dev/typescript-sdk/v1";

// Only initialize Hatchet if token is provided
export const hatchet = process.env.HATCHET_CLIENT_TOKEN
    ? HatchetClient.init({
        // Under Jest the SDK's per-event INFO lines (tens of thousands in the
        // trigger-all-payments load test) drown the output; keep warnings/errors.
        log_level: process.env.JEST_WORKER_ID ? 'WARN' : 'INFO',
        host_port: process.env.HATCHET_CLIENT_HOST_PORT,
      })
    : null;


