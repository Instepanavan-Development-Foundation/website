import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { processedPosts, systemConfig } from "./schema";
import { eq } from "drizzle-orm";

const dbPath = process.env.DB_PATH || "./data/data.db";
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite);

// Simple init helper (instead of full migrations for "tiny" service)
export function initDb() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS processed_posts (
      guid TEXT PRIMARY KEY,
      title TEXT,
      published_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS system_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

export async function getFirstStartTimestamp(): Promise<Date> {
  const result = await db.select()
    .from(systemConfig)
    .where(eq(systemConfig.key, "first_start_at"))
    .limit(1);

  if (result.length > 0) {
    return new Date(result[0].value);
  }

  const now = new Date();
  await db.insert(systemConfig)
    .values({ key: "first_start_at", value: now.toISOString() });
  return now;
}

export async function isProcessed(guid: string): Promise<boolean> {
  const result = await db.select()
    .from(processedPosts)
    .where(eq(processedPosts.guid, guid))
    .limit(1);
  return result.length > 0;
}

export async function markAsProcessed(guid: string, title?: string): Promise<void> {
  await db.insert(processedPosts)
    .values({ guid, title: title || null });
}
