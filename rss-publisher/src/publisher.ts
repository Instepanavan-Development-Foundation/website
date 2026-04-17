import { RssItem } from "./rss-client";
import { publishToTelegram } from "./platforms/telegram";
import { publishToFacebook } from "./platforms/facebook";
import { publishToLinkedIn } from "./platforms/linkedin";
import pino from "pino";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

export async function broadcastPost(item: RssItem): Promise<void> {
  const isDryRun = process.env.DRY_RUN === "true";
  const isEnabled = process.env.ENABLE_PUBLISHING === "true";

  if (!isEnabled) {
    logger.info({ guid: item.guid }, "Publishing disabled by configuration");
    return;
  }

  if (isDryRun) {
    logger.info({ guid: item.guid, title: item.title }, "[DRY RUN] Would publish to all platforms");
    return;
  }

  const results = await Promise.allSettled([
    publishToTelegram(item),
    publishToFacebook(item),
    publishToLinkedIn(item),
  ]);

  results.forEach((result, index) => {
    const platform = ["Telegram", "Facebook", "LinkedIn"][index];
    if (result.status === "fulfilled") {
      logger.info({ guid: item.guid, platform }, "Successfully published");
    } else {
      logger.error({ guid: item.guid, platform, err: result.reason }, "Failed to publish");
    }
  });
}
