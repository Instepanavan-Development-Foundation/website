import Link from "next/link";

import { BlogPost } from "@/components/BlogPost";
import NotFound from "@/components/NotFound";
import getData from "@/src/helpers/getData";
import getMediaSrc from "@/src/helpers/getMediaUrl";
import getProjectFunding from "@/src/helpers/getProjectFunding";
import getFundingAmount from "@/src/helpers/getFundingAmount";
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
      project: { fields: ["documentId", "name", "slug", "isArchived"] },
    },
    filters: { slug },
  });

  const blog = data[0];

  if (!blog) {
    return <NotFound />;
  }

  let showDonateButton = false;

  if (blog.project?.documentId && !blog.project.isArchived) {
    const funding = await getProjectFunding(blog.project.documentId);

    if (funding?.requiredAmount) {
      const gathered = getFundingAmount(funding);

      showDonateButton = gathered < funding.requiredAmount;
    }
  }

  const relatedBlogs = blog.project
    ? await getData({
        type: "blogs",
        populate: {
          images: { fields: ["url"] },
          contribution: { populate: ["contributor.avatar"] },
          attachments: { fields: ["url", "name"] },
          project: { fields: ["name", "slug"] },
        },
        filters: {
          slug: { $ne: slug },
          project: { slug: { $eq: blog.project.slug } },
        },
        sort: ["isFeatured:desc", "createdAt:desc"],
        limit: 4,
      }).then((r) => r.data as IBlog[])
    : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <BlogPost {...blog} isLink={false} showDonateButton={showDonateButton} />

      {relatedBlogs.length > 0 && (
        <div className="mt-12">
          <div className="text-[11px] font-medium tracking-[0.14em] text-primary uppercase mb-1.5">
            ՆՈՒՅՆ ԾՐԱԳՐԻՑ
          </div>
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-[24px] font-semibold tracking-tight text-ink">
              {blog.project.name}-ից ևս
            </h2>
            <Link
              className="text-[13px] font-medium text-primary hover:text-primary-600 transition-colors"
              href={`/project/${blog.project.slug}`}
            >
              Տեսնել նախագիծը →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {relatedBlogs.map((related, index) => (
              <BlogPost key={index} {...related} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
