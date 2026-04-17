import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const processedPosts = sqliteTable("processed_posts", {
  guid: text("guid").primaryKey(),
  title: text("title"),
  publishedAt: text("published_at").default(sql`CURRENT_TIMESTAMP`),
});

export const systemConfig = sqliteTable("system_config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
