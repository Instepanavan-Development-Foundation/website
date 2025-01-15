import RSS from "rss";

const getRssFeed = () => {
  return new RSS({
    title: process.env.RSS_TITLE,
    description: process.env.RSS_DESCRIPTION,
    feed_url: `${process.env.BASE_URL}/api/rss.xml`,
    site_url: `${process.env.BASE_URL}`,
    image_url: "http://example.com/icon.png",
    docs: "http://example.com/rss/docs.html",
    managingEditor: process.env.AUTHOR_NAME,
    webMaster: process.env.AUTHOR_NAME,
    copyright: "2013 " + process.env.AUTHOR_NAME,
    language: "en",
    categories: ["Category 1", "Category 2", "Category 3"],
    pubDate: "May 20, 2012 04:00:00 GMT",
    ttl: "60",
    // TODO: add itunes everthing
    custom_namespaces: {
      itunes: "http://www.itunes.com/dtds/podcast-1.0.dtd",
    },
    custom_elements: [
      { "itunes:subtitle": "A show about everything" },
      { "itunes:author": "John Doe" },
      {
        "itunes:summary":
          "All About Everything is a show about everything. Each week we dive into any subject known to man and talk about it as much as we can. Look for our podcast in the Podcasts app or in the iTunes Store",
      },
      {
        "itunes:owner": [
          { "itunes:name": "John Doe" },
          { "itunes:email": "john.doe@example.com" },
        ],
      },
      {
        "itunes:image": {
          _attr: {
            href: "http://example.com/podcasts/everything/AllAboutEverything.jpg",
          },
        },
      },
      {
        "itunes:category": [
          {
            _attr: {
              text: "Technology",
            },
          },
          {
            "itunes:category": {
              _attr: {
                text: "Gadgets",
              },
            },
          },
        ],
      },
    ],
  });
};

export default {
  generateRss: async (ctx, next) => {
    try {
      const projectSlug = ctx.query.project;
      const project = await strapi.service("api::project.project").find({
        filters: {
          slug: projectSlug,
        },
      });

      const projectId = project?.results?.[0]?.id;
      const blogFilters = project ? { project: projectId} : {};
      
      const blogs = await strapi.entityService.findMany("api::blog.blog", {
        filters: blogFilters,
        limit: parseInt(process.env.RSS_FEED_LIMIT),
        populate: ["createdBy"],
        sort: ["createdAt:desc"],
      });

      console.log("blogs");

      const feed = getRssFeed();

      blogs.forEach((blog) => {
        feed.item({
          title:
            blog.content.length > 20
              ? blog.content.substring(0, 20) + "..."
              : blog.content,
          description: blog.content,
          url: `${process.env.FRONTEND_URL}/blog/${blog.slug}`, // link to the item
          guid: blog.id, // optional - defaults to url
          categories: (blog.tag as { name: string }[])?.map((tag) => tag.name), // optional - array of item categories
          author:
            (blog as any).createdBy.firstName +
            " " +
            (blog as any).createdBy.lastName, // optional - defaults to feed author property
          date: blog.createdAt, // any format that js Date can parse.
          // TODO: add itunes everything
          custom_elements: [
            { "itunes:author": "John Doe" },
            { "itunes:subtitle": "A short primer on table spices" },
            {
              "itunes:image": {
                _attr: {
                  href: "http://example.com/podcasts/everything/AllAboutEverything/Episode1.jpg",
                },
              },
            },
            { "itunes:duration": "7:04" },
          ],
        });
      });

      // cache the xml to send to clients
      var xml = feed.xml();
      ctx.body = xml;
    } catch (err) {
      console.log(err);
      ctx.body = err;
    }
  },
};
