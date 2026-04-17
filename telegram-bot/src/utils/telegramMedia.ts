import { Api } from "grammy";
import { config } from "../config";

export async function downloadFile(
  api: Api,
  fileId: string
): Promise<Buffer> {
  const file = await api.getFile(fileId);
  if (!file.file_path) throw new Error(`No file_path for fileId: ${fileId}`);

  const url = `https://api.telegram.org/file/bot${config.telegramBotToken}/${file.file_path}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
