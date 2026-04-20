import axios from "axios";
import FormData from "form-data";
import { RssItem } from "../rss-client";

const MAX_CHARS = 500;
const MAX_IMAGES = 3;

async function uploadMedia(instanceUrl: string, accessToken: string, imageUrl: string): Promise<string> {
  const imageRes = await axios.get(imageUrl, { responseType: "arraybuffer" });
  const form = new FormData();
  form.append("file", Buffer.from(imageRes.data), {
    filename: "image.jpg",
    contentType: imageRes.headers["content-type"] || "image/jpeg",
  });

  const res = await axios.post(`${instanceUrl}/api/v2/media`, form, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...form.getHeaders(),
    },
  });

  // Wait for media to be processed if async
  const mediaId = res.data.id;
  if (res.status === 202) {
    await new Promise((r) => setTimeout(r, 2000));
  }
  return mediaId;
}

export async function publishToMastodon(item: RssItem): Promise<void> {
  const instanceUrl = process.env.MASTODON_INSTANCE_URL?.replace(/\/$/, "");
  const accessToken = process.env.MASTODON_ACCESS_TOKEN;

  if (!instanceUrl || !accessToken) {
    throw new Error("Mastodon configuration missing");
  }

  const linkText = `\n\n🔗 Տեսնել կայքում: ${item.link}`;
  const maxContent = MAX_CHARS - linkText.length;
  const content =
    item.content.length > maxContent
      ? item.content.slice(0, maxContent - 3) + "..."
      : item.content;
  const status = content + linkText;

  const mediaIds: string[] = [];
  for (const url of item.imageUrls.slice(0, MAX_IMAGES)) {
    try {
      const id = await uploadMedia(instanceUrl, accessToken, url);
      mediaIds.push(id);
    } catch (err) {
      console.error(`Mastodon media upload failed for ${url}:`, err);
    }
  }

  await axios.post(
    `${instanceUrl}/api/v1/statuses`,
    {
      status,
      media_ids: mediaIds.length > 0 ? mediaIds : undefined,
      visibility: "public",
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );
}
