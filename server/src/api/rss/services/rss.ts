import RSS from "rss";

export default {
  getRssFeed: () => {
    return new RSS({
      title: process.env.RSS_TITLE,
      description: process.env.RSS_DESCRIPTION,
      feed_url: `${process.env.BASE_URL}/api/rss.xml`,
      site_url: `${process.env.BASE_URL}`,
      image_url: `${process.env.RSS_ITUNES_IMAGE}`,
      managingEditor: process.env.RSS_AUTHOR_NAME,
      webMaster: process.env.RSS_AUTHOR_NAME,
      language: "hy",
      categories: process.env.RSS_CATEGORIES.split(","),
      custom_elements: [
        { "itunes:subtitle": process.env.RSS_DESCRIPTION },
        { "itunes:author": process.env.RSS_AUTHOR_NAME },
        {
          "itunes:summary": process.env.RSS_DESCRIPTION,
        },
        {
          "itunes:owner": [
            { "itunes:name": process.env.RSS_AUTHOR_NAME },
            { "itunes:email": process.env.RSS_AUTHOR_EMAIL },
          ],
        },
        {
          "itunes:image": {
            _attr: {
              href: `${process.env.RSS_ITUNES_IMAGE}`,
            },
          },
        },
        {
          "itunes:category": process.env.RSS_ITUNES_CATEGORY.split(",").map(
            (category) => ({
              _attr: {
                text: category,
              },
            })
          ),
        },
      ],
    });
  },
};
