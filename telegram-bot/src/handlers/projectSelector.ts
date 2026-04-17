import { logger } from "../logger";
import { Context, InlineKeyboard } from "grammy";
import { Session, sessionStore } from "../state/sessionStore";
import { showDraft } from "./draftReviewer";
import { generateDraft } from "../services/gptService";
import { friendlyError } from "../utils/friendlyError";

export async function showProjectKeyboard(
  ctx: Context,
  chatId: number,
  session: Session
): Promise<void> {
  session.phase = "selecting_project";

  const keyboard = new InlineKeyboard();

  const main = session.availableProjects.filter((p) => p.isMain && !p.isArchived);
  const featured = session.availableProjects.filter((p) => p.isFeatured && !p.isMain && !p.isArchived);
  const active = session.availableProjects.filter((p) => !p.isFeatured && !p.isMain && !p.isArchived);
  const archived = session.availableProjects.filter((p) => p.isArchived);

  if (main.length > 0) {
    keyboard.text("🎠  Slider", "proj:noop").row();
    for (const p of main) keyboard.text(`🎠 ${p.name}`, `proj:${p.documentId}`).row();
  }
  if (featured.length > 0) {
    keyboard.text("⭐  Featured", "proj:noop").row();
    for (const p of featured) keyboard.text(`⭐ ${p.name}`, `proj:${p.documentId}`).row();
  }
  if (active.length > 0) {
    keyboard.text("📌  Active", "proj:noop").row();
    for (const p of active) keyboard.text(`📌 ${p.name}`, `proj:${p.documentId}`).row();
  }
  if (archived.length > 0) {
    keyboard.text("📦  Archived", "proj:noop").row();
    for (const p of archived) keyboard.text(`📦 ${p.name}`, `proj:${p.documentId}`).row();
  }
  keyboard.text("➖ No project", "proj:none");

  await ctx.api.sendMessage(chatId, "Which project does this belong to?", {
    reply_markup: keyboard,
  });
}

export async function handleProjectSelection(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const session = sessionStore.get(chatId);
  if (!session || session.phase !== "selecting_project") {
    await ctx.answerCallbackQuery();
    return;
  }

  await ctx.answerCallbackQuery();

  const data = ctx.callbackQuery?.data ?? "";
  const projectId = data.replace("proj:", "");

  if (projectId === "noop") {
    await ctx.answerCallbackQuery();
    return;
  }

  if (projectId === "none") {
    session.selectedProject = null;
  } else {
    session.selectedProject =
      session.availableProjects.find((p) => p.documentId === projectId) ?? null;
  }

  // Re-generate draft with project context now that we know the project
  session.phase = "processing";

  const processingMsg = await ctx.api.sendMessage(chatId, "Generating draft...");

  try {
    const draft = await generateDraft(
      session.transcripts,
      session.imageDescriptions,
      session.allTags,
      session.allContributors,
      session.selectedProject?.name
    );

    session.draftText = draft.text;
    session.draftSlug = draft.slug;
    session.suggestedTags = draft.tags;
    session.suggestedContributors = draft.contributors.map((name) => {
      const existing = session.allContributors.find(
        (c) => c.fullName.toLowerCase() === name.toLowerCase()
      );
      return existing
        ? { documentId: existing.documentId, fullName: existing.fullName }
        : { documentId: "", fullName: name, isNew: true };
    });

    await ctx.api.deleteMessage(chatId, processingMsg.message_id);
    await showDraft(ctx, chatId, session);
  } catch (err) {
    logger.error({ err }, "Draft generation error:");
    session.phase = "failed";
    session.retryAction = "draft_after_project";
    const RETRY_KEYBOARD = new InlineKeyboard().text("🔄 Retry", "action:retry");
    await ctx.api.editMessageText(chatId, processingMsg.message_id, friendlyError(err), {
      reply_markup: RETRY_KEYBOARD,
    });
  }
}

export async function retryDraftAfterProject(ctx: Context, chatId: number): Promise<void> {
  const session = sessionStore.get(chatId);
  if (!session || session.retryAction !== "draft_after_project") return;
  session.phase = "selecting_project";
  await handleProjectSelection(ctx);
}
