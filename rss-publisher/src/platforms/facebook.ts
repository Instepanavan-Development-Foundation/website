import axios from "axios";
import { RssItem } from "../rss-client";

export async function publishToFacebook(item: RssItem): Promise<void> {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const accessToken = process.env.FACEBOOK_PAGE_TOKEN;

  if (!pageId || !accessToken) {
    throw new Error("Facebook configuration missing");
  }

  const message = item.content;
  let postId = "";

  if (item.imageUrls.length > 1) {
    const photoIds = await Promise.all(
      item.imageUrls.slice(0, 4).map(async (url) => {
        const res = await axios.post(`https://graph.facebook.com/v21.0/${pageId}/photos`, null, {
          params: {
            url,
            published: false,
            access_token: accessToken,
          },
        });
        return { media_fbid: res.data.id };
      })
    );

    const res = await axios.post(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
      message,
      attached_media: photoIds,
      access_token: accessToken,
    });
    postId = res.data.id;

  } else if (item.imageUrls.length === 1) {
    const res = await axios.post(`https://graph.facebook.com/v21.0/${pageId}/photos`, null, {
      params: {
        url: item.imageUrls[0],
        caption: message,
        access_token: accessToken,
      },
    });
    // In photo posts, the ID returned is the photo ID, but it acts as a post ID for comments
    postId = res.data.id;
  } else {
    const res = await axios.post(`https://graph.facebook.com/v21.0/${pageId}/feed`, null, {
      params: {
        message,
        access_token: accessToken,
      },
    });
    postId = res.data.id;
  }

  // Post the link as a comment
  if (postId) {
    try {
      await axios.post(`https://graph.facebook.com/v21.0/${postId}/comments`, null, {
        params: {
          message: `🔗 Կարդալ սկզբնաղբյուրում: ${item.link}`,
          access_token: accessToken,
        },
      });
    } catch (err) {
      console.error("Facebook comment failed:", err);
    }
  }
}
