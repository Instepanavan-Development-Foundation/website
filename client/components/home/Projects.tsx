import Link from "next/link";

import { ProjectCard } from "./ProjectCard";

import { IProject } from "@/src/models/project";
import getData from "@/src/helpers/getData";
import getProjectFunding from "@/src/helpers/getProjectFunding";

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

  // Fetch dynamic funding data for all projects
  const projectsWithFunding = await Promise.all(
    projects.map(async (project) => {
      const funding = await getProjectFunding(project.documentId);
      let gatheredAmount = project.gatheredAmount ?? 0;

      if (funding) {
        if (funding.donationType === "recurring") {
          gatheredAmount = funding.currentMonth.recurring.amount;
        } else {
          gatheredAmount = funding.allTime.oneTime.amount;
        }
      }

      return {
        ...project,
        gatheredAmount,
        requiredAmount: funding?.requiredAmount ?? project.requiredAmount ?? 0,
      };
    }),
  );

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
      <div className="flex flex-wrap justify-center gap-5">
        {projectsWithFunding.map((project, index) => (
          <Link key={index} className="block w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]" href={`/project/${project.slug}`}>
            <ProjectCard {...project} />
          </Link>
        ))}
      </div>
    </section>
  );
}
