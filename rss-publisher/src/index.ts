import "dotenv/config";
import pino from "pino";
import { fetchRss } from "./rss-client";
import { initDb, isProcessed, markAsProcessed, getFirstStartTimestamp } from "./db";
import { broadcastPost } from "./publisher";

const logger = pino({ 
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty",
    options: { colorize: true }
  }
});

const RSS_FEED_URL = process.env.RSS_FEED_URL;
const POLLING_INTERVAL = parseInt(process.env.POLLING_INTERVAL_MS || "300000");

async function poll() {
  if (!RSS_FEED_URL) {
    logger.error("RSS_FEED_URL is not defined");
    return;
  }

  try {
    const firstStartAt = await getFirstStartTimestamp();
    logger.debug({ firstStartAt }, "Fetching RSS feed...");
    const items = await fetchRss(RSS_FEED_URL);
    
    // Check which items are unprocessed AND newer than the first start date
    const unprocessedItems = [];
    for (const item of items) {
      const isAlreadyProcessed = await isProcessed(item.guid);
      const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
      const isNewerThanFirstStart = pubDate >= firstStartAt;

      if (!isAlreadyProcessed && isNewerThanFirstStart) {
        unprocessedItems.push(item);
      } else if (!isAlreadyProcessed) {
        // Silently mark as processed if it's too old, so we don't keep checking it
        logger.debug({ guid: item.guid, pubDate }, "Ignoring old post from before first start");
        await markAsProcessed(item.guid, item.title);
      }
    }
    
    // Process items in reverse (oldest first)
    unprocessedItems.reverse();

    if (unprocessedItems.length === 0) {
      logger.debug("No new posts found.");
      return;
    }

    logger.info(`Found ${unprocessedItems.length} new posts.`);

    for (const item of unprocessedItems) {
      try {
        await broadcastPost(item);
        await markAsProcessed(item.guid, item.title);
      } catch (err) {
        logger.error({ guid: item.guid, err }, "Error processing item");
      }
    }
  } catch (err) {
    logger.error({ err }, "Error during polling");
  }
}

logger.info(`Starting RSS Publisher... Polling ${RSS_FEED_URL} every ${POLLING_INTERVAL / 1000}s`);

// Initialize Database Table
initDb();

// Run immediately on start
poll();

// Then every interval
setInterval(poll, POLLING_INTERVAL);
