import axios from "axios";
import { RssItem } from "../rss-client";

async function uploadImageToLinkedIn(url: string, orgId: string, accessToken: string, version: string): Promise<string> {
  const commonHeaders = {
    "Authorization": `Bearer ${accessToken}`,
    "LinkedIn-Version": version,
    "X-Restli-Protocol-Version": "2.0.0",
  };

  const initResponse = await axios.post(
    "https://api.linkedin.com/rest/images?action=initializeUpload",
    {
      initializeUploadRequest: {
        owner: `urn:li:organization:${orgId}`,
      },
    },
    { headers: commonHeaders }
  );

  const uploadUrl = initResponse.data.value.uploadUrl;
  const imageUrn = initResponse.data.value.image;

  const imageBuffer = await axios.get(url, { responseType: "arraybuffer" });
  await axios.put(uploadUrl, imageBuffer.data, {
    headers: {
      ...commonHeaders,
      "Content-Type": "image/jpeg",
    },
  });

  return imageUrn;
}

export async function publishToLinkedIn(item: RssItem): Promise<void> {
  const orgId = process.env.LINKEDIN_ORG_ID;
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  const version = "202501";

  if (!orgId || !accessToken) {
    throw new Error("LinkedIn configuration missing");
  }

  const commonHeaders = {
    "Authorization": `Bearer ${accessToken}`,
    "LinkedIn-Version": version,
    "X-Restli-Protocol-Version": "2.0.0",
  };

  const imageUrns: string[] = [];
  for (const url of item.imageUrls.slice(0, 9)) {
    try {
      const urn = await uploadImageToLinkedIn(url, orgId, accessToken, version);
      imageUrns.push(urn);
    } catch (err) {
      console.error(`LinkedIn upload failed for ${url}:`, err);
    }
  }

  const postData: any = {
    author: `urn:li:organization:${orgId}`,
    commentary: `${item.title}\n\n${item.content.slice(0, 500)}${item.content.length > 500 ? "..." : ""}`,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  };

  if (imageUrns.length > 1) {
    postData.content = {
      multiImage: {
        images: imageUrns.map(id => ({ id })),
      },
    };
  } else if (imageUrns.length === 1) {
    postData.content = {
      media: {
        title: item.title,
        id: imageUrns[0],
      },
    };
  }

  const res = await axios.post("https://api.linkedin.com/rest/posts", postData, {
    headers: {
      ...commonHeaders,
      "Content-Type": "application/json",
    },
  });

  // LinkedIn returns the post URN in the x-restli-id header
  const postUrn = res.headers["x-restli-id"] || res.headers["location"]?.split("/").pop();

  // Step 4: Post the link as a comment
  if (postUrn) {
    try {
      // Ensure the URN is correctly formatted and encoded
      // Organizational posts often return urn:li:share or urn:li:activity
      const encodedPostUrn = encodeURIComponent(postUrn);
      
      await axios.post(
        `https://api.linkedin.com/rest/socialActions/${encodedPostUrn}/comments`,
        {
          actor: `urn:li:organization:${orgId}`,
          message: {
            text: `🔗 Read the full blog post on our website: ${item.link}`,
          },
        },
        {
          headers: {
            ...commonHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (err) {
      // Don't crash the whole process if just the comment fails
      console.error("LinkedIn comment failed (check if you have Community Management API access):", err);
    }
  }
}
