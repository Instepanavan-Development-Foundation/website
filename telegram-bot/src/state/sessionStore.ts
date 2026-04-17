import { config } from "../config";

export type Phase =
  | "idle"
  | "collecting"
  | "processing"
  | "awaiting_context"
  | "selecting_project"
  | "reviewing_draft"
  | "awaiting_edit"
  | "publishing";

export interface Project {
  documentId: string;
  name: string;
  isFeatured?: boolean;
  isArchived?: boolean;
  isMain?: boolean;
}

export interface Session {
  phase: Phase;
  voiceBuffers: Buffer[];
  imageBuffers: Buffer[];
  transcripts: string[];
  imageDescriptions: string[];
  draftText: string;
  draftSlug: string;
  suggestedTags: string[];
  selectedProject: Project | null;
  availableProjects: Project[];
  allTags: string[];
  allContributors: { documentId: string; fullName: string; about: string }[];
  suggestedContributors: { documentId: string; fullName: string; isNew?: boolean }[];
  draftMessageId: number | null;
  editHistory: { role: "user" | "assistant"; content: string }[];
  createdAt: number;
}

function createSession(): Session {
  return {
    phase: "idle",
    voiceBuffers: [],
    imageBuffers: [],
    transcripts: [],
    imageDescriptions: [],
    draftText: "",
    draftSlug: "",
    suggestedTags: [],
    selectedProject: null,
    availableProjects: [],
    allTags: [],
    allContributors: [],
    suggestedContributors: [],
    draftMessageId: null,
    editHistory: [],
    createdAt: Date.now(),
  };
}

const sessions = new Map<number, Session>();
// Timers stored separately — not serializable, not part of Session
const mediaTimers = new Map<number, NodeJS.Timeout>();
const expiryTimers = new Map<number, NodeJS.Timeout>();

export const sessionStore = {
  get(chatId: number): Session | undefined {
    return sessions.get(chatId);
  },

  getOrCreate(chatId: number): Session {
    if (!sessions.has(chatId)) {
      const session = createSession();
      sessions.set(chatId, session);
      this.scheduleExpiry(chatId);
    }
    return sessions.get(chatId)!;
  },

  reset(chatId: number): void {
    this.clearMediaTimer(chatId);
    sessions.set(chatId, createSession());
    this.scheduleExpiry(chatId);
  },

  delete(chatId: number): void {
    this.clearMediaTimer(chatId);
    const et = expiryTimers.get(chatId);
    if (et) clearTimeout(et);
    expiryTimers.delete(chatId);
    sessions.delete(chatId);
  },

  setMediaTimer(chatId: number, fn: () => void): void {
    this.clearMediaTimer(chatId);
    const handle = setTimeout(fn, config.mediaBufferSeconds * 1000);
    mediaTimers.set(chatId, handle);
  },

  clearMediaTimer(chatId: number): void {
    const handle = mediaTimers.get(chatId);
    if (handle) clearTimeout(handle);
    mediaTimers.delete(chatId);
  },

  scheduleExpiry(chatId: number): void {
    const et = expiryTimers.get(chatId);
    if (et) clearTimeout(et);
    const handle = setTimeout(
      () => this.delete(chatId),
      config.sessionTimeoutMinutes * 60 * 1000
    );
    expiryTimers.set(chatId, handle);
  },
};
