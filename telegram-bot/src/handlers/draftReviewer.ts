import { logger } from "../logger";
import { Context, InlineKeyboard } from "grammy";
import { Session, sessionStore } from "../state/sessionStore";
import { uploadAllImages, createBlog, createContributor } from "../services/strapiService";
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

  const session = sessionStore.get(chatId);
  if (!session || session.phase !== "reviewing_draft") {
    await ctx.answerCallbackQuery();
    return;
  }

  const action = ctx.callbackQuery?.data?.replace("action:", "") ?? "";
  await ctx.answerCallbackQuery();

  if (action === "publish") {
    await handlePublish(ctx, chatId, session);
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

    await ctx.api.editMessageText(
      chatId,
      msg.message_id,
      `✅ Published!\n\n${blogUrl}`
    );

    sessionStore.reset(chatId);
  } catch (err) {
    logger.error({ err }, "Publish error:");
    await ctx.api.editMessageText(chatId, msg.message_id, friendlyError(err));
    session.phase = "reviewing_draft";
  }
}
