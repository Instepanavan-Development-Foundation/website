import RSSService from "../services/rss";

export default {
  generateRss: async (ctx, next) => {
    const eclipsesLimit = 20;
    const minute = 60 * 1000;

    try {
      const projectSlug = ctx.query.project;

      const blogs = await strapi.entityService.findMany("api::blog.blog", {
        filters: {
          project: {
            slug: projectSlug,
          }
        },
        limit: parseInt(process.env.RSS_FEED_LIMIT),
        populate: ["createdBy", "images"],
        sort: ["createdAt:desc"],
      });
      
      const feed = RSSService.getRssFeed();

      blogs.forEach((blog) => {
        const title =
          blog.content.length > eclipsesLimit
            ? blog.content.substring(0, eclipsesLimit) + "..."
            : blog.content;

        const author =
          (blog as any).createdBy.firstName +
          " " +
          (blog as any).createdBy.lastName;

        feed.item({
          title,
          description: blog.content,
          url: `${process.env.FRONTEND_URL}/blog/${blog.slug}`,
          guid: blog.id,
          categories: (blog.tag as { name: string }[])?.map((tag) => tag.name),
          author: author,
          date: blog.createdAt,
          custom_elements: [
            { "itunes:author": author },
            { "itunes:subtitle": title },
            {
              "itunes:image": {
                _attr: {
                  href: `${process.env.BASE_URL}${(blog as any).images?.[0]?.url}` || process.env.RSS_ITUNES_IMAGE,
                },
              },
            },
            { "itunes:duration": Math.ceil(blog.content.length / minute) + " minutes" },
          ],
        });
      });

      const xml = feed.xml();
      ctx.body = xml;
    } catch (err) {
      ctx.body = err;
    }
  },
};
