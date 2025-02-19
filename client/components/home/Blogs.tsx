import Link from "next/link";
import { button as buttonStyles } from "@nextui-org/theme";
import getData from "@/src/helpers/getData";
import { IBlog } from "@/src/models/blog";
import { BlogPost } from "../BlogPost";
import RSS from "@/components/home/RSS";

export default async function Blogs() {
  const { data: blogs }: { data: IBlog[] } = await getData({
    type: "blogs",
    populate: {
      images: { fields: ["url"] },
      project: { fields: ["name", "slug"] },
      contribution: { populate: ["contributor.avatar"] },
      attachments: { fields: ["url", "name"] },
    },
    sort: "createdAt:desc",
  });
  return (
    <div className="w-full max-w-7xl my-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold mb-6">Մեր աշխատանքը</h2>
        <RSS />
      </div>
      <div className="gap-6 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4">
        {blogs.length > 0 ? (
          blogs.map((post, index) => <BlogPost key={index} {...post} />)
        ) : (
          <p>Աշխատանքներ չկան</p>
        )}
      </div>
      <div className="col-span-full flex justify-center mt-8">
        <Link
          href="/blog"
          className={buttonStyles({
            variant: "flat",
            radius: "full",
            size: "lg",
          })}
        >
          Դիտել բոլոր հոդվածները
          <svg
            className="ml-2 w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}
