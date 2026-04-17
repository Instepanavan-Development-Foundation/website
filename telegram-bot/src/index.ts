import "dotenv/config";
import { Bot, Context } from "grammy";
import { config } from "./config";
import { logger } from "./logger";
import { handleVoice, handlePhoto } from "./handlers/mediaCollector";
import { handleProjectSelection } from "./handlers/projectSelector";
import { handleAction } from "./handlers/draftReviewer";
import { handleText } from "./handlers/editHandler";

const bot = new Bot(config.telegramBotToken);

// Request logging middleware
bot.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;

  const chat = ctx.chat;
  const user = ctx.from;
  const chatName = chat && "title" in chat ? chat.title
    : user?.username ? `@${user.username}`
    : user?.first_name ?? "unknown";

  const msg = ctx.message;
  const type = msg?.voice ? "voice"
    : msg?.photo ? `photo(×${msg.photo.length})`
    : msg?.text ? `text("${msg.text.slice(0, 40)}")`
    : ctx.callbackQuery ? `callback("${ctx.callbackQuery.data}")`
    : "update";

  logger.info({ chat: chatName, type, ms }, "request");
});

const seenChats = new Set<number>();

function isAllowed(ctx: Context): boolean {
  const chatId = ctx.chat?.id;
  if (chatId === undefined) return false;
  if (config.allowedChatIds.size > 0) return config.allowedChatIds.has(chatId);
  if (!seenChats.has(chatId)) {
    seenChats.add(chatId);
    const name = ctx.chat && "title" in ctx.chat ? ctx.chat.title
      : ctx.chat && "username" in ctx.chat && ctx.chat.username ? `@${ctx.chat.username}`
      : ctx.chat && "first_name" in ctx.chat ? ctx.chat.first_name
      : String(chatId);
    logger.info({ chatId }, `New chat: ${name}`);
  }
  return true;
}

bot.on("message:voice", async (ctx) => {
  if (!isAllowed(ctx)) return;
  await handleVoice(ctx);
});

bot.on("message:photo", async (ctx) => {
  if (!isAllowed(ctx)) return;
  await handlePhoto(ctx);
});

bot.callbackQuery(/^proj:/, async (ctx) => {
  if (!isAllowed(ctx)) return;
  await handleProjectSelection(ctx);
});

bot.callbackQuery(/^action:/, async (ctx) => {
  if (!isAllowed(ctx)) return;
  await handleAction(ctx);
});

bot.on("message:text", async (ctx) => {
  if (!isAllowed(ctx)) return;
  if (ctx.message.text.startsWith("/")) return;
  await handleText(ctx);
});

bot.command("start", async (ctx) => {
  await ctx.reply(`Chat ID: ${ctx.chat.id}\n\nSend voice notes and/or photos to create a microblog post.`);
});

bot.command("cancel", async (ctx) => {
  if (!isAllowed(ctx)) return;
  const { sessionStore } = await import("./state/sessionStore");
  sessionStore.reset(ctx.chat.id);
  await ctx.reply("Session cancelled.");
});

bot.catch((err) => {
  logger.error({ err }, "Bot error");
});

async function logAllowedChats(): Promise<void> {
  if (config.allowedChatIds.size === 0) {
    logger.info("No chat filter — responding to all chats");
    return;
  }
  for (const chatId of config.allowedChatIds) {
    try {
      const chat = await bot.api.getChat(chatId);
      const name = "title" in chat ? chat.title
        : "username" in chat && chat.username ? `@${chat.username}`
        : "first_name" in chat ? chat.first_name
        : String(chatId);
      logger.info({ chatId }, `✅ Chat found: ${name}`);
    } catch {
      logger.warn({ chatId }, "⚠️  Chat not found or bot not a member");
    }
  }
}

logger.info("Starting Instepanavan Telegram bot...");
void bot.start({
  drop_pending_updates: true,
  onStart: () => {
    logger.info("Bot is running. Checking allowed chats...");
    void logAllowedChats();
  },
});
