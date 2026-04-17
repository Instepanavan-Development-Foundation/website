import { Context, InlineKeyboard } from "grammy";
import { logger } from "../logger";
import { friendlyError } from "../utils/friendlyError";
import { sessionStore } from "../state/sessionStore";
import { downloadFile } from "../utils/telegramMedia";
import { transcribeVoice, processAllMedia } from "../services/geminiService";
import { generateDraft } from "../services/gptService";
import { getProjects, getTags, getContributors } from "../services/strapiService";
import { showProjectKeyboard } from "./projectSelector";

const RETRY_KEYBOARD = new InlineKeyboard().text("🔄 Retry", "action:retry");

export async function handleVoice(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const session = sessionStore.getOrCreate(chatId);

  // Voice while reviewing draft → treat as edit instruction
  if (session.phase === "reviewing_draft" || session.phase === "awaiting_edit") {
    const voice = ctx.message?.voice;
    if (!voice) return;
    try {
      const buffer = await downloadFile(ctx.api, voice.file_id);
      const processingMsg = await ctx.api.sendMessage(chatId, "Transcribing...");
      const transcript = await transcribeVoice(buffer);
      await ctx.api.editMessageText(chatId, processingMsg.message_id, `🎙 "${transcript}"`);
      // Delegate to edit handler with transcribed text
      const { handleVoiceEdit } = await import("./editHandler");
      await handleVoiceEdit(ctx, chatId, transcript);
    } catch (err) {
      logger.error({ err }, "Voice edit error");
      await ctx.reply(friendlyError(err));
    }
    return;
  }

  // If waiting for context after image-only, handle voice as the context
  if (session.phase === "awaiting_context") {
    const voice = ctx.message?.voice;
    if (!voice) return;
    try {
      const buffer = await downloadFile(ctx.api, voice.file_id);
      const processingMsg = await ctx.api.sendMessage(chatId, "Transcribing...");
      const transcript = await transcribeVoice(buffer);
      session.voiceBuffers.push(buffer);
      session.transcripts.push(transcript);
      await ctx.api.editMessageText(chatId, processingMsg.message_id, `🎙 "${transcript}"`);
      await runFullProcessing(ctx, chatId);
    } catch (err) {
      logger.error({ err }, "Voice context error");
      await ctx.reply(friendlyError(err));
      sessionStore.reset(chatId);
    }
    return;
  }

  if (!["idle", "collecting"].includes(session.phase)) return;

  const voice = ctx.message?.voice;
  if (!voice) return;

  const isFirst = session.phase === "idle";
  try {
    const buffer = await downloadFile(ctx.api, voice.file_id);
    session.voiceBuffers.push(buffer);
    session.phase = "collecting";
    if (isFirst) await ctx.reply("🎙 Got it! Waiting a moment for more media...");
    else await ctx.reply("🎙 Added.");
  } catch (err) {
    logger.error({ err }, "Failed to download voice");
    await ctx.reply("Failed to download voice message. Please try again.");
    return;
  }

  scheduleProcessing(ctx, chatId);
}

export async function handlePhoto(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const session = sessionStore.getOrCreate(chatId);

  // Also accept photos while waiting for context — user may send more images after the prompt
  if (session.phase === "awaiting_context") {
    const photos = ctx.message?.photo;
    const photo = photos?.[photos.length - 1];
    if (!photo) return;
    try {
      const buffer = await downloadFile(ctx.api, photo.file_id);
      session.imageBuffers.push(buffer);
      await ctx.reply("📸 Added.");
    } catch (err) {
      logger.error({ err }, "Failed to download photo in awaiting_context");
      await ctx.reply("Failed to download photo. Please try again.");
    }
    return;
  }

  if (!["idle", "collecting"].includes(session.phase)) return;

  const photos = ctx.message?.photo;
  const photo = photos?.[photos.length - 1];
  if (!photo) return;

  const isFirst = session.phase === "idle";
  try {
    const buffer = await downloadFile(ctx.api, photo.file_id);
    session.imageBuffers.push(buffer);
    session.phase = "collecting";
    if (isFirst) await ctx.reply("📸 Got it! Waiting a moment for more media...");
    else await ctx.reply("📸 Added.");
  } catch (err) {
    logger.error({ err }, "Failed to download photo");
    await ctx.reply("Failed to download photo. Please try again.");
    return;
  }

  scheduleProcessing(ctx, chatId);
}

// Called from editHandler when user sends text while in awaiting_context
export async function handleTextContext(ctx: Context, chatId: number, text: string): Promise<void> {
  const session = sessionStore.get(chatId);
  if (!session || session.phase !== "awaiting_context") return;

  session.transcripts.push(text);

  try {
    await runFullProcessing(ctx, chatId);
  } catch (err) {
    logger.error({ err }, "Text context error");
    await ctx.api.sendMessage(chatId, friendlyError(err));
    sessionStore.reset(chatId);
  }
}

function scheduleProcessing(ctx: Context, chatId: number): void {
  sessionStore.setMediaTimer(chatId, () => {
    void triggerProcessing(ctx, chatId);
  });
}

async function triggerProcessing(ctx: Context, chatId: number): Promise<void> {
  const session = sessionStore.get(chatId);
  if (!session || session.phase !== "collecting") return;

  if (session.voiceBuffers.length === 0 && session.imageBuffers.length === 0) {
    sessionStore.reset(chatId);
    return;
  }

  // Image(s) only — ask for context before generating
  if (session.voiceBuffers.length === 0) {
    session.phase = "awaiting_context";
    await ctx.api.sendMessage(
      chatId,
      "Got the photo(s)! Now send a voice note or write a short description so I can create a blog post."
    );
    return;
  }

  await runFullProcessing(ctx, chatId);
}

async function runFullProcessing(ctx: Context, chatId: number): Promise<void> {
  const session = sessionStore.get(chatId);
  if (!session) return;

  session.phase = "processing";
  const processingMsg = await ctx.api.sendMessage(chatId, "Processing...");

  try {
    // Transcribe voice + describe images + fetch Strapi data in parallel
    // If transcripts already populated (from awaiting_context flow), skip voice transcription
    const voiceToTranscribe = session.transcripts.length > 0 ? [] : session.voiceBuffers;

    const [mediaResult, projects, tags, contributors] = await Promise.all([
      processAllMedia(voiceToTranscribe, session.imageBuffers),
      getProjects(),
      getTags(),
      getContributors(),
    ]);

    // Merge: pre-populated transcripts (text context) + freshly transcribed voice
    session.transcripts = [...session.transcripts, ...mediaResult.transcripts];
    session.imageDescriptions = mediaResult.imageDescriptions;
    session.availableProjects = projects;
    session.allTags = tags;
    session.allContributors = contributors;
    logger.debug({ tags, contributors: contributors.map((c) => c.fullName) }, "Strapi data loaded");

    // Warn if image descriptions were skipped
    if (mediaResult.imageWarning) {
      await ctx.api.sendMessage(chatId, mediaResult.imageWarning);
    }

    // Show transcript(s) so user can verify
    if (session.transcripts.length > 0) {
      const transcriptText = session.transcripts.map((t) => `🎙 "${t}"`).join("\n");
      await ctx.api.sendMessage(chatId, transcriptText);
    }

    // Generate draft
    const draft = await generateDraft(
      session.transcripts,
      session.imageDescriptions,
      session.allTags,
      session.allContributors,
    );

    logger.debug({ tags: draft.tags, contributors: draft.contributors }, "GPT draft generated");
    session.draftText = draft.text;
    session.draftSlug = draft.slug;
    session.suggestedTags = draft.tags;
    // Map suggested names to known contributors (or mark as new)
    session.suggestedContributors = draft.contributors.map((name) => {
      const existing = contributors.find(
        (c) => c.fullName.toLowerCase() === name.toLowerCase()
      );
      return existing
        ? { documentId: existing.documentId, fullName: existing.fullName }
        : { documentId: "", fullName: name, isNew: true };
    });

    await ctx.api.deleteMessage(chatId, processingMsg.message_id);
    await showProjectKeyboard(ctx, chatId, session);
  } catch (err: unknown) {
    logger.error({ err }, "Processing error");
    session.phase = "failed";
    session.retryAction = "processing";
    await ctx.api.editMessageText(chatId, processingMsg.message_id, friendlyError(err), {
      reply_markup: RETRY_KEYBOARD,
    });
  }
}

export async function retryProcessing(ctx: Context, chatId: number): Promise<void> {
  const session = sessionStore.get(chatId);
  if (!session || session.retryAction !== "processing") return;
  // Reset transcripts so voice gets re-transcribed if needed
  session.transcripts = [];
  session.imageDescriptions = [];
  await runFullProcessing(ctx, chatId);
}
