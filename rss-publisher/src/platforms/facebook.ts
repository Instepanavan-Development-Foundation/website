import axios from "axios";
import { RssItem } from "../rss-client";

export async function publishToFacebook(item: RssItem): Promise<void> {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const accessToken = process.env.FACEBOOK_PAGE_TOKEN;

  if (!pageId || !accessToken) {
    throw new Error("Facebook configuration missing");
  }

  const message = item.content;

  if (item.imageUrls.length > 1) {
    const photoIds = await Promise.all(
      item.imageUrls.slice(0, 4).map(async (url) => {
        const res = await axios.post(`https://graph.facebook.com/v25.0/${pageId}/photos`, null, {
          params: {
            url,
            published: false,
            access_token: accessToken,
          },
        });
        return { media_fbid: res.data.id };
      })
    );

    await axios.post(`https://graph.facebook.com/v25.0/${pageId}/feed`, {
      message,
      attached_media: photoIds,
      access_token: accessToken,
    });

  } else if (item.imageUrls.length === 1) {
    await axios.post(`https://graph.facebook.com/v25.0/${pageId}/photos`, null, {
      params: {
        url: item.imageUrls[0],
        caption: message,
        access_token: accessToken,
      },
    });
  } else {
    await axios.post(`https://graph.facebook.com/v25.0/${pageId}/feed`, null, {
      params: {
        message,
        access_token: accessToken,
      },
    });
  }
}
