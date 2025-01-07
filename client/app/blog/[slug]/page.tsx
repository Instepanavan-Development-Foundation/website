import { BlogPost } from "@/components/BlogPost";
import getData from "@/src/helpers/getData";
import { IBlog } from "@/src/models/blog";

interface IProjectPageParams {
  params: { slug: string };
}

export default async function BlogPage({ params }: IProjectPageParams) {
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
    return null; // TODO not found component
  }

  return (
    // TODO maybe change styles?
    <div className="container mx-auto px-4 py-8">
        <BlogPost {...blog} />
    </div>
  );
}
