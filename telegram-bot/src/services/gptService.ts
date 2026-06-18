import { GoogleGenAI } from "@google/genai";
import { config } from "../config";

const genai = new GoogleGenAI({ apiKey: config.googleApiKey });

const SYSTEM_PROMPT = `You are a content writer for Instepanavan (Ինստեփանավան), an Armenian charitable foundation focused on community development, education, and humanitarian aid in Armenia.

Your task is to generate short, warm microblog posts in Eastern Armenian (Արևելահայերեն).

INPUT CONTEXT you will receive:
- Voice transcript(s) from team members describing an event or activity
- Written context typed directly by the user
- Existing tags already used on the site (use these when relevant)
- Optional: a project name the post belongs to

OUTPUT FORMAT — always respond with valid JSON only, no markdown:
{
  "text": "<2-3 sentence blog post in Armenian>",
  "slug": "<url-slug>",
  "tags": ["<tag1>", "<tag2>"],
  "contributors": [
    { "name": "<fullName>", "text": "<what they contributed in Armenian, empty string if not mentioned>", "isFeatured": false }
  ],
  "project": "<project name, only include when changing the project>"
}

WRITING STYLE:
- 2-3 sentences maximum — this is a microblog, not an article
- Write in Eastern Armenian script
- Factual and direct — only describe what is actually mentioned in the transcript or visible in the images
- Do NOT invent feelings, atmosphere, warmth, or emotional impressions that are not explicitly stated
- Do NOT add generic closing sentences like "joy was felt" or "warmth of togetherness" unless someone actually said that
- Avoid formal or bureaucratic language
- Reference the project name naturally if provided
- Use present or recent past tense for immediacy
- Do NOT add hashtags, links, or calls to action in the text

CONTRIBUTOR RULES:
- Only include contributors who are explicitly mentioned by name in the transcript
- Never infer or guess contributors based on context, roles, or implied involvement
- If someone is explicitly named and matches the contributors list, use their full name from the list
- If someone is explicitly named but NOT in the list, include their name anyway — they will be created as a new contributor
- If no one is mentioned by name, return an empty array
- For each contributor, write what they specifically contributed in the "text" field (in Armenian): donation amount, items provided, services rendered, work done, etc.
- Examples of good contribution text: "10,000,000֏ նվիրատվություն նոր գրադարանին", "Հինգ տարով տրվեց տարածք", "4000$ ներդրում"
- If the contribution is significant (major donation, key partner), set isFeatured to true
- If the specific contribution is not mentioned, use empty string for "text"

SLUG RULES:
- Generate a short, readable URL slug in English (2-4 words)
- Lowercase, hyphens only, no special characters, no Armenian script
- Based on the main topic of the post (e.g. "road-repair-instepanavan", "volunteer-day-school")
- Must match: ^[a-z0-9-]+$

TAG RULES:
- Suggest 1-3 tags that best describe the content
- Prefer tags from the existing list when they fit
- If no existing tag fits well, invent a short relevant one (can be in Armenian or English, lowercase)
- Tags should be short keywords, not phrases
- If the edit instruction explicitly names tags (e.g. prefixed with #), use exactly those tags

EDITING MODE:
When given an existing post and an edit instruction, rewrite it according to the instruction while preserving the factual content. Return the same JSON format.
If the instruction asks to change the project, include the "project" field with the exact project name from the available projects list. Omit the "project" field if the project is not being changed.`;

export interface Contribution {
  name: string;
  text: string;
  isFeatured: boolean;
}

export interface DraftResult {
  text: string;
  slug: string;
  tags: string[];
  contributors: Contribution[];
  project?: string; // only set when AI is changing the project
}

async function callGemini(contents: { role: "user" | "model"; parts: { text: string }[] }[]): Promise<string> {
  const response = await genai.models.generateContent({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      temperature: 0.7,
    },
    contents,
  });
  return response.text?.trim() ?? "{}";
}

function parseContributors(raw: unknown): Contribution[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((c) => {
    if (typeof c === "string") return { name: c, text: "", isFeatured: false };
    const obj = c as Record<string, unknown>;
    return {
      name: String(obj.name ?? ""),
      text: String(obj.text ?? ""),
      isFeatured: Boolean(obj.isFeatured ?? false),
    };
  }).filter((c) => c.name);
}

export async function generateDraft(
  transcripts: string[],
  textInputs: string[],
  availableTags: string[],
  contributors: { fullName: string; about: string }[],
  projectName?: string
): Promise<DraftResult> {
  const parts: string[] = [];

  if (transcripts.length > 0) {
    parts.push("Voice transcripts:\n" + transcripts.join("\n---\n"));
  }
  if (textInputs.length > 0) {
    parts.push("Written context:\n" + textInputs.join("\n---\n"));
  }
  parts.push("Existing tags (use if relevant, or suggest new ones): " + (availableTags.length > 0 ? availableTags.join(", ") : "(none yet)"));

  if (contributors.length > 0) {
    const contribList = contributors.map((c) => `- ${c.fullName}${c.about ? ` (${c.about.slice(0, 80)})` : ""}`).join("\n");
    parts.push(`Known contributors/partners:\n${contribList}`);
  }
  if (projectName) {
    parts.push("Project: " + projectName);
  }

  const raw = await callGemini([{ role: "user", parts: [{ text: parts.join("\n\n") }] }]);
  const parsed = JSON.parse(raw) as Partial<Record<string, unknown>>;

  return {
    text: String(parsed.text ?? ""),
    slug: sanitizeSlug(String(parsed.slug ?? "")),
    tags: Array.isArray(parsed.tags) ? parsed.tags as string[] : [],
    contributors: parseContributors(parsed.contributors),
  };
}

export async function editDraft(
  existing: { text: string; slug?: string; tags: string[]; contributors: Contribution[]; projectName?: string },
  editInstruction: string,
  availableTags: string[],
  allContributors: { fullName: string; about: string }[],
  availableProjects: { name: string }[],
  editHistory: { role: "user" | "assistant"; content: string }[]
): Promise<DraftResult> {
  const knownContribList = allContributors.length > 0
    ? allContributors.map((c) => `- ${c.fullName}${c.about ? ` (${c.about.slice(0, 60)})` : ""}`).join("\n")
    : "(none)";

  const currentContribs = existing.contributors.length > 0
    ? existing.contributors.map((c) => c.text ? `${c.name} — ${c.text}` : c.name).join(", ")
    : "none";

  const currentState = [
    `Current text:\n${existing.text}`,
    `Current tags: ${existing.tags.join(", ") || "none"}`,
    `Current contributors: ${currentContribs}`,
    `Current project: ${existing.projectName || "none"}`,
    `Available projects: ${availableProjects.map((p) => p.name).join(", ") || "none"}`,
    `Known contributors:\n${knownContribList}`,
    `Available tags (or suggest new): ${availableTags.join(", ") || "none"}`,
    `Edit instruction: ${editInstruction}`,
  ].join("\n\n");

  // Convert edit history to Gemini's role format (assistant → model)
  const historyContents: { role: "user" | "model"; parts: { text: string }[] }[] = editHistory.map((h) => ({
    role: h.role === "assistant" ? "model" : "user",
    parts: [{ text: h.content }],
  }));

  const raw = await callGemini([
    ...historyContents,
    { role: "user", parts: [{ text: currentState }] },
  ]);
  const parsed = JSON.parse(raw) as Partial<Record<string, unknown>>;

  return {
    text: String(parsed.text ?? existing.text),
    slug: sanitizeSlug(String(parsed.slug ?? existing.slug ?? "")),
    tags: Array.isArray(parsed.tags) ? parsed.tags as string[] : [],
    contributors: parseContributors(parsed.contributors),
    project: typeof parsed.project === "string" && parsed.project ? parsed.project : undefined,
  };
}

function sanitizeSlug(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
