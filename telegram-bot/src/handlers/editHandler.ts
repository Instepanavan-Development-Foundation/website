import { logger } from "../logger";
import { Context } from "grammy";
import { Session, sessionStore } from "../state/sessionStore";
import { editDraft } from "../services/gptService";
import { showDraft } from "./draftReviewer";
import { friendlyError } from "../utils/friendlyError";
import { handleTextContext } from "./mediaCollector";

async function runEdit(ctx: Context, chatId: number, session: Session, instruction: string): Promise<void> {
  session.phase = "processing";
  const msg = await ctx.api.sendMessage(chatId, "Rewriting...");

  try {
    const result = await editDraft(
      {
        text: session.draftText,
        slug: session.draftSlug,
        tags: session.suggestedTags,
        contributors: session.suggestedContributors.map((c) => c.fullName),
      },
      instruction,
      session.allTags,
      session.allContributors,
      session.editHistory
    );

    // Persist edit exchange in history for multi-turn context
    session.editHistory.push(
      { role: "user", content: instruction },
      { role: "assistant", content: JSON.stringify({ text: result.text, tags: result.tags, contributors: result.contributors }) }
    );

    session.draftText = result.text;
    session.draftSlug = result.slug || session.draftSlug;
    session.suggestedTags = result.tags;

    // Resolve contributor names → documentIds (or mark new)
    session.suggestedContributors = result.contributors.map((name) => {
      const existing = session.allContributors.find(
        (c) => c.fullName.toLowerCase() === name.toLowerCase()
      );
      return existing
        ? { documentId: existing.documentId, fullName: existing.fullName }
        : { documentId: "", fullName: name, isNew: true };
    });

    const oldDraftMessageId = session.draftMessageId;
    session.draftMessageId = msg.message_id; // reuse status message as new draft
    await showDraft(ctx, chatId, session);
    if (oldDraftMessageId && oldDraftMessageId !== msg.message_id) {
      try { await ctx.api.deleteMessage(chatId, oldDraftMessageId); } catch { /* already gone */ }
    }
  } catch (err) {
    logger.error({ err }, "Edit error");
    await ctx.api.editMessageText(chatId, msg.message_id, friendlyError(err));
    session.phase = "awaiting_edit";
  }
}

export async function handleVoiceEdit(ctx: Context, chatId: number, transcript: string): Promise<void> {
  const session = sessionStore.get(chatId);
  if (!session) return;
  session.phase = "awaiting_edit";
  await runEdit(ctx, chatId, session, transcript);
}

export async function handleText(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const session = sessionStore.get(chatId);
  if (!session) return;

  // Route text to context handler when waiting for image description
  if (session.phase === "awaiting_context") {
    const text = ctx.message?.text?.trim();
    if (text) await handleTextContext(ctx, chatId, text);
    return;
  }

  // Allow direct text edits while reviewing (without pressing Edit button)
  if (session.phase === "reviewing_draft") {
    const text = ctx.message?.text?.trim();
    if (!text) return;
    await runEdit(ctx, chatId, session, text);
    return;
  }

  if (session.phase !== "awaiting_edit") return;

  const instruction = ctx.message?.text?.trim();
  if (!instruction) return;

  await runEdit(ctx, chatId, session, instruction);
}
