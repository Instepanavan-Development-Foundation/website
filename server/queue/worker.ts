import { hatchet } from "./hatchet-client";
import { onCron } from "./workflow";

export default async function initQueue() {
  console.log("running hatchet!");
  const worker = await hatchet.worker("on-cron-worker", {
    workflows: [onCron],
  });

  await worker.start();
}
