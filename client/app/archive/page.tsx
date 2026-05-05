import Link from "next/link";

import getData from "@/src/helpers/getData";
import { IProject } from "@/src/models/project";
import { ProjectCard } from "@/components/home/ProjectCard";
import getProjectFunding from "@/src/helpers/getProjectFunding";
import getFundingAmount from "@/src/helpers/getFundingAmount";

export const metadata = {
  title: "Արխիվացված նախագծեր",
  description: "Instepanavan հիմնադրամի արխիվացված նագագծեր",
};

export default async function Home() {
  const { data: projects }: { data: IProject[] } = await getData({
    type: "projects",
    sort: ["isFeatured:desc", "createdAt:desc"],
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
    filters: {
      isArchived: true,
    },
  });

  // Fetch dynamic funding data for all projects
  const projectsWithFunding = await Promise.all(
    projects.map(async (project) => {
      const funding = await getProjectFunding(project.documentId);
      let gatheredAmount = project.gatheredAmount ?? 0;

      if (funding) {
        gatheredAmount = getFundingAmount(funding, true, project.gatheredAmount ?? 0);
      }

      return {
        ...project,
        gatheredAmount,
        requiredAmount: funding?.requiredAmount ?? project.requiredAmount ?? 0,
      };
    }),
  );

  return (
    <section className="flex flex-col px-4">
      {/* Projects Section */}
      <div className="w-full container my-8">
        <h2 className="text-3xl font-bold mb-6">Ավարտված նախագծեր</h2>
        <p className="mb-6">
          {" "}
          Այս նագագծերը ավարտված են, և այլևս չեն թարմացվում։
        </p>
        {projectsWithFunding.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {projectsWithFunding.map((project, index) => (
              <Link key={index} href={`/project/${project.slug}`}>
                <ProjectCard key={index} {...project} />
              </Link>
            ))}
          </div>
        ) : (
          <p>Արխիվացված նախագծեր չկան</p>
        )}
      </div>
    </section>
  );
}
