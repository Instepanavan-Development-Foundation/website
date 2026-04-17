export function friendlyError(err: unknown): string {
  const e = err as {
    status?: number;
    code?: string;
    error?: { code?: string; message?: string };
    message?: string;
  };

  const status = e.status ?? 0;
  const code = e.code ?? e.error?.code ?? "";
  const message = e.message ?? e.error?.message ?? "";

  // Gemini (check before generic 429 handler)
  if (status === 503 || (status === 429 && message.includes("generativelanguage")))
    return "⚠️ Gemini is overloaded right now. Please try again in a moment.";
  if (status === 400 && message.includes("API key not valid"))
    return "⚠️ Gemini API key is invalid. Check GOOGLE_API_KEY in .env";
  if (status === 429 && message.includes("RESOURCE_EXHAUSTED"))
    return "⚠️ Gemini daily quota exceeded. Enable billing at aistudio.google.com or wait until tomorrow.";

  // OpenAI
  if (code === "insufficient_quota" || (status === 429 && message.includes("quota")))
    return "⚠️ OpenAI quota exceeded. Top up at platform.openai.com/settings/billing";
  if (status === 429)
    return "⚠️ OpenAI rate limit hit. Please wait a moment and try again.";
  if ((status === 401 || status === 403) && message.toLowerCase().includes("openai"))
    return "⚠️ OpenAI API key is invalid. Check OPENAI_API_KEY in .env";

  // Strapi
  if (message.includes("STRAPI") || message.includes("api/blogs") || message.includes("api/upload"))
    return "⚠️ Failed to publish to Strapi. Check STRAPI_API_TOKEN or server status.";
  if (status === 401 || status === 403)
    return "⚠️ Strapi API token is invalid or expired. Regenerate it in Strapi admin.";

  // Network
  if (code === "ECONNREFUSED" || code === "ENOTFOUND")
    return "⚠️ Cannot reach a required service. Check your network/server.";

  return "Something went wrong. Please try again.";
}
