import { HatchetClient } from "@hatchet-dev/typescript-sdk/v1";

// Only initialize Hatchet if token is provided
export const hatchet = process.env.HATCHET_CLIENT_TOKEN
    ? HatchetClient.init({
        log_level: 'INFO',
        host_port: process.env.HATCHET_CLIENT_HOST_PORT,
      })
    : null;


