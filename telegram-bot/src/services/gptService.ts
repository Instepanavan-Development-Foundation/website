import OpenAI from "openai";
import { config } from "../config";

const client = new OpenAI({
  apiKey: config.openaiApiKey,
});

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
- If the content mentions or involves a specific person from the contributors list, include their full name
- If someone is mentioned who is NOT in the list, include their name anyway — they will be created as a new contributor
- If no specific person is mentioned, return an empty array
- Only tag real people involved in the activity, not generic references

SLUG RULES:
- Generate a short, readable URL slug in English (2-4 words)
- Lowercase, hyphens only, no special characters, no Armenian script
- Based on the main topic of the post (e.g. "road-repair-instepanavan", "volunteer-day-school")
- Must match: ^[a-z0-9-]+$

TAG RULES:
- Suggest 1-3 tags that best describe the content
- Prefer tags from the existing list when they fit
- If no existing tag fits well, invent a short relevant one in English (lowercase)
- Tags should be short keywords, not phrases

EDITING MODE:
When given an existing post and an edit instruction, rewrite it according to the instruction while preserving the factual content. Return the same JSON format.`;

export interface DraftResult {
  text: string;
  slug: string;
  tags: string[];
  contributors: string[]; // full names — matched or new
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

  const response = await client.chat.completions.create({
    model: "gpt-5.4-mini-2026-03-17",
    response_format: { type: "json_object" },
    temperature: 0.7,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: parts.join("\n\n") },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content) as Partial<DraftResult>;

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

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...editHistory.map((h) => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    })),
    { role: "user", content: currentState },
  ];

  const response = await client.chat.completions.create({
    model: "gpt-5.4-mini-2026-03-17",
    response_format: { type: "json_object" },
    temperature: 0.7,
    messages,
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content) as Partial<DraftResult>;

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
