import Link from "next/link";
import { button as buttonStyles } from "@heroui/theme";
import { ArrowRightIcon } from "lucide-react";

import { BlogPost } from "../BlogPost";

import getData from "@/src/helpers/getData";
import { IBlog } from "@/src/models/blog";
import RSS from "@/components/home/RSS";

const LIMIT = Number(process.env.NEXT_PUBLIC_QUERY_LIMIT || 8);

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
    limit: LIMIT,
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
          className={buttonStyles({
            variant: "flat",
            radius: "full",
            size: "lg",
          })}
          href="/blog"
        >
          Դիտել բոլոր հոդվածները
          <ArrowRightIcon className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
