import { GoogleGenAI } from "@google/genai";
import { config } from "../config";

const genai = new GoogleGenAI({ apiKey: config.googleApiKey });

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 2000): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 503 && attempt < retries) {
        console.warn(`Gemini 503, retrying in ${delayMs}ms (attempt ${attempt}/${retries})...`);
        await new Promise((res) => setTimeout(res, delayMs * attempt));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Unreachable");
}

export async function transcribeVoice(audioBuffer: Buffer): Promise<string> {
  return withRetry(async () => {
    const response = await genai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: "audio/ogg",
                data: audioBuffer.toString("base64"),
              },
            },
            {
              text: "Transcribe this voice message exactly as spoken. The speaker uses Armenian (Eastern or Western dialect). Return only the transcript text, no commentary or formatting.",
            },
          ],
        },
      ],
    });
    return response.text?.trim() ?? "";
  });
}

export async function processAllMedia(
  voiceBuffers: Buffer[]
): Promise<{ transcripts: string[] }> {
  const transcripts = await Promise.all(voiceBuffers.map(transcribeVoice));
  return { transcripts };
}
