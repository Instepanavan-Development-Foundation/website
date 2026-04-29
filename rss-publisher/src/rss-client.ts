import Parser from "rss-parser";

const parser = new Parser({
  customFields: {
    item: [["image", "images", { keepArray: true }]],
  },
});

export interface RssItem {
  guid: string;
  title: string;
  content: string;
  link: string;
  imageUrl?: string;
  imageUrls: string[]; // Support for multiple images
  pubDate?: string;
}

export async function fetchRss(url: string): Promise<RssItem[]> {
  const feed = await parser.parseURL(url);
  
  return feed.items.map(item => {
    const imageUrls: string[] = [];
    
    // Parse custom images field (array of URLs)
    if ((item as any).images && Array.isArray((item as any).images)) {
      (item as any).images.forEach((url: string) => {
        if (typeof url === "string" && url.trim()) {
          imageUrls.push(url.trim());
        }
      });
    }

    // Fallback to enclosure if no custom images found
    if (imageUrls.length === 0 && item.enclosure?.url) {
      imageUrls.push(item.enclosure.url);
    }

    return {
      guid: item.guid || item.link || "",
      title: item.title || "",
      content: item.contentSnippet || item.content || "",
      link: item.link || "",
      imageUrl: imageUrls[0], // Keep legacy for single-image calls
      imageUrls,
      pubDate: item.pubDate,
    };
  });
}
