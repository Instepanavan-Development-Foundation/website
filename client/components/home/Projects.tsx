import Link from "next/link";

import { ProjectCard } from "./ProjectCard";

import { IProject } from "@/src/models/project";
import getData from "@/src/helpers/getData";

export default async function Projects({
  isArchived,
}: {
  isArchived: boolean;
}) {
  const { data: projects }: { data: IProject[] } = await getData({
    type: "projects",
    populate: {
      image: { fields: ["url"] },
      blogs: {
        sort: ["isFeatured:desc", "createdAt:desc"],
        populate: ["contribution.contributor.avatar"],
        filters: {
          contribution: {
            $null: false,
          },
        },
      },
    },
    filters: { isArchived },
    sort: ["isFeatured:desc", "createdAt:desc"],
  });

  if (projects.length === 0) return null;

  const eyebrow = isArchived ? "ԱՐԽԻՎ" : "ՄԵՐ ՈՒՂԻՆ";
  const heading = isArchived ? "Ավարտված նախագծեր" : "Ակտիվ նախագծեր";

  return (
    <section className="w-full my-12 md:my-16" id={isArchived ? undefined : "projects"}>
      <div className="flex items-baseline justify-between mb-6 md:mb-8">
        <div>
          <div className="text-[11px] font-medium tracking-[0.14em] text-primary uppercase mb-1.5">
            {eyebrow}
          </div>
          <h2 className="text-[28px] md:text-[32px] font-semibold tracking-tighter2 text-ink">
            {heading}
          </h2>
        </div>
        {isArchived && (
          <Link
            className="text-[13px] font-medium text-primary hover:text-primary-600 transition-colors"
            href="/archive"
          >
            Տեսնել բոլորը →
          </Link>
        )}
      </div>
      <div className="-mx-4 md:-mx-8 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-nowrap gap-5 px-4 md:px-8 pb-4">
          {projects.map((project, index) => (
            <Link
              key={index}
              className="block shrink-0 w-[82vw] sm:w-[44vw] lg:w-110"
              href={`/project/${project.slug}`}
            >
              <ProjectCard {...project} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
