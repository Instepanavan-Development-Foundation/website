import { BlogPost } from "@/components/BlogPost";
import NotFound from "@/components/NotFound";
import getData from "@/src/helpers/getData";
import getMediaSrc from "@/src/helpers/getMediaUrl";
import { IBlog } from "@/src/models/blog";
import { IParams } from "@/src/models/params";

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

  return {
    title: "Բլոգ",
    description: blog.content.slice(0, 100),
    openGraph: {
      type: "website",
      images: { url: getMediaSrc(blog?.images?.[0]) },
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
