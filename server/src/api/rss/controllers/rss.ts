import RSSService from "../services/rss";
import markdownToTxt from "markdown-to-txt";

export default {
  generateRss: async (ctx, next) => {
    const eclipsesLimit = 100;
    const minute = 60 * 1000;

    try {
      const projectSlug = ctx.query.project;

      const filters = projectSlug
        ? {
            project: {
              slug: projectSlug,
            },
          }
        : {};

      const blogs = await strapi.documents("api::blog.blog").findMany({
        filters,
        limit: parseInt(process.env.RSS_FEED_LIMIT || "20"),
        populate: ["createdBy", "images"],
        sort: ["createdAt:desc"],
      });

      const feed = RSSService.getRssFeed();

      blogs.forEach((blog) => {
        const content = markdownToTxt(blog.content);

        const title =
          content.length > eclipsesLimit
            ? content.substring(0, eclipsesLimit) + "..."
            : content;

        const createdBy = (blog as any).createdBy;
        const author = createdBy
          ? `${createdBy.firstName || ""} ${createdBy.lastName || ""}`.trim()
          : process.env.RSS_AUTHOR_NAME;

        const allImages = (blog as any).images || [];
        const firstImage = allImages[0];
        const imageUrl = firstImage
          ? `${process.env.BASE_URL}${firstImage.url}`
          : process.env.RSS_ITUNES_IMAGE;

        const itemData: any = {
          title,
          description: content,
          url: `${process.env.FRONTEND_URL}/blog/${blog.slug}`,
          guid: blog.documentId,
          categories: (blog.tag as { name: string }[])?.map((tag) => tag.name),
          author: author,
          date: blog.createdAt,
          custom_elements: [
            { "itunes:author": author },
            { "itunes:subtitle": title },
            {
              "itunes:image": {
                _attr: {
                  href: imageUrl,
                },
              },
            },
            {
              "itunes:duration":
                Math.ceil(content.length / minute) + " minutes",
            },
            // Add custom field for multiple images
            {
              images: allImages.map((img: any) => ({
                image: {
                  url: `${process.env.BASE_URL}${img.url}`,
                  mime: img.mime,
                  size: img.size
                }
              }))
            }
          ],
        };

        // Add enclosure for images (standard RSS image support)
        if (firstImage) {
          itemData.enclosure = {
            url: imageUrl,
            type: firstImage.mime || 'image/jpeg',
            size: firstImage.size || 0,
          };
        }

        feed.item(itemData);
      });

      const xml = feed.xml();
      ctx.type = "application/xml";
      ctx.body = xml;
    } catch (err) {
      strapi.log.error(err);
      ctx.status = 500;
      ctx.body = { error: err instanceof Error ? err.message : String(err) };
    }
  },
};
