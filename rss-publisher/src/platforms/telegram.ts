import { Bot, InputMediaBuilder } from "grammy";
import { RssItem } from "../rss-client";

export async function publishToTelegram(item: RssItem): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHANNEL_ID;

  if (!token || !chatId) {
    throw new Error("Telegram configuration missing");
  }

  const bot = new Bot(token);
  const MAX_PHOTOS = 4;
  const linkLabel = item.imageUrls.length > MAX_PHOTOS ? "Բոլոր նկարները" : "Կարդալ սկզբնաղբյուրում";
  const caption = `${item.content}\n\n🔗 <a href="${item.link}">${linkLabel}</a>`;

  if (item.imageUrls.length > 1) {
    // Send as a media group (gallery)
    // Note: only the first item in the group should have the caption
    const media = item.imageUrls.slice(0, MAX_PHOTOS).map((url, index) => {
      return InputMediaBuilder.photo(url, index === 0 ? { caption, parse_mode: "HTML" } : {});
    });
    await bot.api.sendMediaGroup(chatId, media);
  } else if (item.imageUrls.length === 1) {
    await bot.api.sendPhoto(chatId, item.imageUrls[0], {
      caption,
      parse_mode: "HTML",
    });
  } else {
    // Text only
    await bot.api.sendMessage(chatId, caption, {
      parse_mode: "HTML",
    });
  }
}
