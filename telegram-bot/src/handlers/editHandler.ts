import { logger } from "../logger";
import { Context } from "grammy";
import { Session, sessionStore } from "../state/sessionStore";
import { editDraft } from "../services/gptService";
import { showDraft } from "./draftReviewer";
import { friendlyError } from "../utils/friendlyError";
import { handleTextContext, handleTextAsInput } from "./mediaCollector";

async function runEdit(ctx: Context, chatId: number, session: Session, instruction: string): Promise<void> {
  session.phase = "processing";
  const msg = await ctx.api.sendMessage(chatId, "Rewriting...");

  try {
    const result = await editDraft(
      {
        text: session.draftText,
        slug: session.draftSlug,
        tags: session.suggestedTags,
        contributors: session.suggestedContributors.map((c) => ({
          name: c.fullName,
          text: c.contributionText,
          isFeatured: c.isFeatured,
        })),
        projectName: session.selectedProject?.name,
      },
      instruction,
      session.allTags,
      session.allContributors,
      session.availableProjects,
      session.editHistory
    );

    // Persist edit exchange in history for multi-turn context
    session.editHistory.push(
      { role: "user", content: instruction },
      { role: "assistant", content: JSON.stringify({ text: result.text, tags: result.tags, contributors: result.contributors, project: result.project ?? null }) }
    );

    session.draftText = result.text;
    session.draftSlug = result.slug || session.draftSlug;
    session.suggestedTags = result.tags;

    // Handle project change
    if (result.project) {
      const matched = session.availableProjects.find(
        (p) => p.name.toLowerCase() === result.project!.toLowerCase()
      );
      if (matched) session.selectedProject = matched;
    }

    session.suggestedContributors = result.contributors.map(({ name, text, isFeatured }) => {
      const existing = session.allContributors.find(
        (c) => c.fullName.toLowerCase() === name.toLowerCase()
      );
      return existing
        ? { documentId: existing.documentId, fullName: existing.fullName, contributionText: text, isFeatured }
        : { documentId: "", fullName: name, isNew: true, contributionText: text, isFeatured };
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

  const text = ctx.message?.text?.trim();
  if (!text) return;

  const existingSession = sessionStore.get(chatId);

  // Accept text as initial content input (no session yet, or idle)
  if (!existingSession || existingSession.phase === "idle") {
    await handleTextAsInput(ctx, chatId, text, true);
    return;
  }

  const session = existingSession;

  // Add text to ongoing media collection
  if (session.phase === "collecting") {
    await handleTextAsInput(ctx, chatId, text, false);
    return;
  }

  // Route text as context when waiting for image description
  if (session.phase === "awaiting_context") {
    await handleTextContext(ctx, chatId, text);
    return;
  }

  // Direct text edits while reviewing or awaiting edit instruction
  if (session.phase === "reviewing_draft" || session.phase === "awaiting_edit") {
    await runEdit(ctx, chatId, session, text);
    return;
  }
}
