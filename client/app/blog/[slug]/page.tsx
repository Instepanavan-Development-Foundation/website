import { BlogPost } from "@/components/BlogPost";
import NotFound from "@/components/NotFound";
import getData from "@/src/helpers/getData";
import { IBlog } from "@/src/models/blog";
import { IParams } from "@/src/models/params";

export default async function BlogPage({ params }: IParams) {
  const { slug } = await params;
  const { data }: { data: IBlog[] } = await getData({
    type: "blogs",
    populate: {
      images: { fields: ["url"] },
      contribution: { populate: ["contributor"] },
      attachments: { fields: ["url", "name"] },
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
