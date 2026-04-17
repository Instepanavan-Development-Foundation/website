import { logger } from "../logger";
import { Context, InlineKeyboard } from "grammy";
import { Session, sessionStore } from "../state/sessionStore";
import { uploadAllImages, createBlog, createContributor, deleteBlog } from "../services/strapiService";
import { config } from "../config";
import { friendlyError } from "../utils/friendlyError";

const REVIEW_KEYBOARD = new InlineKeyboard()
  .text("✅ Publish", "action:publish");

export function buildDraftText(session: Session): string {
  const tags = session.suggestedTags.map((t) => `#${t}`).join(" ");
  const project = session.selectedProject?.name ?? "None";
  const contributors = session.suggestedContributors.length > 0
    ? session.suggestedContributors.map((c) => c.isNew ? `${c.fullName} ✨new` : c.fullName).join(", ")
    : "none";
  return `📝 Draft:\n\n${session.draftText}\n\n🔗 Slug: ${session.draftSlug || "auto"}\n🏷 Tags: ${tags || "none"}\n👤 Contributors: ${contributors}\n📁 Project: ${project}`;
}

export async function showDraft(
  ctx: Context,
  chatId: number,
  session: Session
): Promise<void> {
  session.phase = "reviewing_draft";
  const text = buildDraftText(session);

  if (session.draftMessageId) {
    try {
      await ctx.api.editMessageText(chatId, session.draftMessageId, text, {
        reply_markup: REVIEW_KEYBOARD,
      });
      return;
    } catch {
      // Message may have been deleted — fall through to send new one
    }
  }

  const msg = await ctx.api.sendMessage(chatId, text, {
    reply_markup: REVIEW_KEYBOARD,
  });
  session.draftMessageId = msg.message_id;
}

export async function handleAction(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const callbackData = ctx.callbackQuery?.data ?? "";
  await ctx.answerCallbackQuery();

  // Delete is session-independent — documentId is encoded in callback data
  if (callbackData.startsWith("action:delete:")) {
    const documentId = callbackData.replace("action:delete:", "");
    await handleDelete(ctx, chatId, documentId);
    return;
  }

  const session = sessionStore.get(chatId);
  if (!session || session.phase !== "reviewing_draft") return;

  if (callbackData === "action:publish") {
    await handlePublish(ctx, chatId, session);
  } else if (callbackData === "action:show_draft") {
    session.draftMessageId = null; // force new message
    await showDraft(ctx, chatId, session);
  }
}

async function handlePublish(
  ctx: Context,
  chatId: number,
  session: Session
): Promise<void> {
  session.phase = "publishing";

  const msg = await ctx.api.sendMessage(chatId, "Publishing...");

  try {
    const [imageIds] = await Promise.all([uploadAllImages(session.imageBuffers)]);

    // Create any new contributors that don't exist yet
    const resolvedContributors = await Promise.all(
      session.suggestedContributors.map(async (c) => {
        if (!c.isNew) return c;
        logger.info({ fullName: c.fullName }, "Creating new contributor");
        const created = await createContributor(c.fullName);
        return { ...c, documentId: created.documentId, isNew: false };
      })
    );

    const blog = await createBlog({
      content: session.draftText,
      slug: session.draftSlug || undefined,
      imageIds,
      tagNames: session.suggestedTags,
      projectDocumentId: session.selectedProject?.documentId ?? null,
      contributorDocumentIds: resolvedContributors.map((c) => c.documentId).filter(Boolean),
    });

    const frontendUrl = config.strapiBaseUrl.replace(/^https?:\/\/api\./, "https://");
    const blogUrl = `${frontendUrl}/blog/${blog.slug}`;

    sessionStore.reset(chatId); // back to idle immediately so new posts can start

    const deleteKeyboard = new InlineKeyboard().text("🗑 Delete post", `action:delete:${blog.documentId}`);
    await ctx.api.editMessageText(
      chatId,
      msg.message_id,
      `✅ Published!\n\n${blogUrl}`,
      { reply_markup: deleteKeyboard }
    );
  } catch (err) {
    const responseData = (err as { response?: { data?: unknown } }).response?.data;
    logger.error({ err, responseData }, "Publish error:");
    session.phase = "reviewing_draft";
    const retryKeyboard = new InlineKeyboard()
      .text("🔄 Retry publish", "action:publish")
      .text("✏️ Back to draft", "action:show_draft");
    await ctx.api.editMessageText(chatId, msg.message_id, friendlyError(err), {
      reply_markup: retryKeyboard,
    });
  }
}

async function handleDelete(
  ctx: Context,
  chatId: number,
  documentId: string
): Promise<void> {
  try {
    await deleteBlog(documentId);
    await ctx.api.sendMessage(chatId, "🗑 Blog post deleted.");
  } catch (err) {
    logger.error({ err }, "Delete error:");
    await ctx.api.sendMessage(chatId, friendlyError(err));
  }
}
