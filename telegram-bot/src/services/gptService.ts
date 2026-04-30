import { GoogleGenAI } from "@google/genai";
import { config } from "../config";

const genai = new GoogleGenAI({ apiKey: config.googleApiKey });

const SYSTEM_PROMPT = `You are a content writer for Instepanavan (Ինստեփանավան), an Armenian charitable foundation focused on community development, education, and humanitarian aid in Armenia.

Your task is to generate short, warm microblog posts in Eastern Armenian (Արևելահայերեն).

INPUT CONTEXT you will receive:
- Voice transcript(s) from team members describing an event or activity
- Image description(s) from field photos
- Existing tags already used on the site (use these when relevant)
- Optional: a project name the post belongs to

OUTPUT FORMAT — always respond with valid JSON only, no markdown:
{
  "text": "<2-3 sentence blog post in Armenian>",
  "slug": "<url-slug>",
  "tags": ["<tag1>", "<tag2>"],
  "contributors": ["<fullName1>", "<fullName2>"]
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
- Only include contributors who are explicitly mentioned by name in the transcript or image descriptions
- Never infer or guess contributors based on context, roles, or implied involvement
- If someone is explicitly named and matches the contributors list, use their full name from the list
- If someone is explicitly named but NOT in the list, include their name anyway — they will be created as a new contributor
- If no one is mentioned by name, return an empty array

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
When given an existing post and an edit instruction, rewrite it according to the instruction while preserving the factual content. Return the same JSON format.`;

export interface DraftResult {
  text: string;
  slug: string;
  tags: string[];
  contributors: string[]; // full names — matched or new
}

async function callGemini(contents: { role: "user" | "model"; parts: { text: string }[] }[]): Promise<string> {
  const response = await genai.models.generateContent({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      temperature: 0.7,
    },
    contents,
  });
  return response.text?.trim() ?? "{}";
}

export async function generateDraft(
  transcripts: string[],
  imageDescriptions: string[],
  availableTags: string[],
  contributors: { fullName: string; about: string }[],
  projectName?: string
): Promise<DraftResult> {
  const parts: string[] = [];

  if (transcripts.length > 0) {
    parts.push("Voice transcripts:\n" + transcripts.join("\n---\n"));
  }
  if (imageDescriptions.length > 0) {
    parts.push("Image descriptions:\n" + imageDescriptions.join("\n---\n"));
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
  const parsed = JSON.parse(raw) as Partial<DraftResult>;

  return {
    text: parsed.text ?? "",
    slug: sanitizeSlug(parsed.slug ?? ""),
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    contributors: Array.isArray(parsed.contributors) ? parsed.contributors : [],
  };
}

export async function editDraft(
  existing: { text: string; slug?: string; tags: string[]; contributors: string[] },
  editInstruction: string,
  availableTags: string[],
  allContributors: { fullName: string; about: string }[],
  editHistory: { role: "user" | "assistant"; content: string }[]
): Promise<DraftResult> {
  const contribList = allContributors.length > 0
    ? allContributors.map((c) => `- ${c.fullName}${c.about ? ` (${c.about.slice(0, 60)})` : ""}`).join("\n")
    : "(none)";

  const currentState = [
    `Current text:\n${existing.text}`,
    `Current tags: ${existing.tags.join(", ") || "none"}`,
    `Current contributors: ${existing.contributors.join(", ") || "none"}`,
    `Known contributors:\n${contribList}`,
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
  const parsed = JSON.parse(raw) as Partial<DraftResult>;

  return {
    text: parsed.text ?? existing.text,
    slug: sanitizeSlug(parsed.slug ?? existing.slug ?? ""),
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    contributors: Array.isArray(parsed.contributors) ? parsed.contributors : [],
  };
}

function sanitizeSlug(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
