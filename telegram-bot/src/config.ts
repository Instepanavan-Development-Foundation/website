import "dotenv/config";

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

const rawChatIds = process.env["TELEGRAM_ALLOWED_CHAT_IDS"] ?? "";
const parsedChatIds = rawChatIds
  .split(",")
  .map((s) => parseInt(s.trim(), 10))
  .filter((n) => !isNaN(n));

export const config = {
  telegramBotToken: required("TELEGRAM_BOT_TOKEN"),
  // Empty set = no filter, accept all chats
  allowedChatIds: new Set<number>(parsedChatIds),
  googleApiKey: required("GOOGLE_API_KEY"),
  strapiBaseUrl: optional("STRAPI_BASE_URL", "http://localhost:1337"),
  strapiApiToken: required("STRAPI_API_TOKEN"),
  mediaBufferSeconds: parseInt(optional("MEDIA_BUFFER_SECONDS", "5"), 10),
  sessionTimeoutMinutes: parseInt(optional("SESSION_TIMEOUT_MINUTES", "30"), 10),
} as const;
