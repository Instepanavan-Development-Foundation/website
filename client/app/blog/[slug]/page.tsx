import { BlogPost } from "@/components/BlogPost";
import NotFound from "@/components/NotFound";
import getData from "@/src/helpers/getData";
import getMediaSrc from "@/src/helpers/getMediaUrl";
import { IBlog } from "@/src/models/blog";
import { IParams } from "@/src/models/params";

async function fetchLinkOgImage(content: string): Promise<string | null> {
  const match = content.match(/https?:\/\/[^\s)>\]"]+/);
  const url = match?.[0];

  if (!url) return null;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Instepanavan/1.0)" },
      next: { revalidate: 3600 },
    });
    const html = await res.text();
    const ogMatch =
      html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i) ||
      html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);

    return ogMatch?.[1] ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: IParams) {
  const { slug } = await params;
  const { data }: { data: IBlog[] } = await getData({
    type: "blogs",
    fields: ["content"],
    filters: { slug },
    populate: {
      images: { fields: ["url"] },
    },
  });

  const [blog] = data;

  if (!blog) {
    return;
  }

  const imageUrl = getMediaSrc(blog?.images?.[0]);
  let ogImage = imageUrl
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}${imageUrl}`
    : await fetchLinkOgImage(blog.content);

  return {
    title: "Բլոգ",
    description: blog.content.slice(0, 100),
    openGraph: {
      type: "website",
      ...(ogImage && { images: { url: ogImage } }),
    },
  };
}

export default async function BlogPage({ params }: IParams) {
  const { slug } = await params;
  const { data }: { data: IBlog[] } = await getData({
    type: "blogs",
    populate: {
      images: { fields: ["url"] },
      contribution: { populate: ["contributor.avatar"] },
      attachments: { fields: ["url", "name"] },
      project: { fields: ["name", "slug"] },
    },
    filters: { slug },
  });

  const blog = data[0];

  if (!blog) {
    return <NotFound />;
  }

  return (
    // TODO maybe change styles?
    <div className="container mx-auto px-4 py-8">
      <BlogPost {...blog} isLink={false} />
    </div>
  );
}
