import { ChatAnthropic } from "@langchain/anthropic";

const llm = new ChatAnthropic({
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  model: "claude-3-7-sonnet-20250219",
  temperature: 0,
  maxTokens: 2048,
  maxRetries: 2,
});

export async function translateText(data) {
  const prompt = `
  Please translate the following JSON object into Russian (ru), French (fr), and English (en).
  Ensure that the output retains the original structure with translated values.

  - Do NOT translate URLs, file paths.
  - If there are words that are not in Armenian (e.g., "inStepanavan" or other names, or anything which is not in Armenian), leave them unchanged.
  - Keep the same JSON key structure.
  - Please do not add any additional information or change the meaning of the text.
  - Maintain proper grammar, spelling, and punctuation.
  - This translation will be injected into strapi.

  **Input JSON:**
  ${JSON.stringify(data, null, 2)}


  **Expected Output Format (Only JSON, no extra text):**
  {
    "ru": {
      "field_name": "translated text in Russian",
      ...
    },
    "fr": {
      "field_name": "translated text in French",
      ...
    },
    "en": {
      "field_name": "translated text in English",
      ...
    }
  }

  return only json object, without any additional text.
  
  `;

  const aiMsg = await llm.invoke([
    ["system", "You are a highly skilled translator specializing in Armenian to multiple languages."],
    ["human", prompt],
  ]);

  try {
    return aiMsg.content
  } catch (error) {
    console.error("Error parsing AI response:", error);
    return null;
  }
}

export function extractJSON(str){
  const match = str.match(/\{[\s\S]*\}/);
  if (match) {
      try {
          return JSON.parse(match[0]);
      } catch (error) {
          console.error("Invalid JSON:", error);
      }
  }
  return null;
};
