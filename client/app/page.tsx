import HomeHero from "@/components/home/HomeHero";
import Projects from "@/components/home/Projects";
import Blogs from "@/components/home/Blogs";
import TrustedByContributors from "@/components/home/TrustedByContributors";
import Donation from "@/components/home/Donation";
import getData from "@/src/helpers/getData";
import getProjectFunding from "@/src/helpers/getProjectFunding";
import getFundingAmount from "@/src/helpers/getFundingAmount";
import { IProject } from "@/src/models/project";

export default async function Home() {
  const { data: mainProjects }: { data: IProject[] } = await getData({
    type: "projects",
    filters: {
      isMain: true,
    },
    populate: {
      image: {
        fields: ["url", "alternativeText", "name"],
      },
    },
    fields: [
      "documentId",
      "name",
      "description",
      "slug",
      "gatheredAmount",
      "requiredAmount",
    ],
  });

  const featuredProjects = await Promise.all(
    (mainProjects ?? []).map(async (project) => {
      const funding = await getProjectFunding(project.documentId);
      if (!funding) return project;

      const gatheredAmount = getFundingAmount(funding);

      return { ...project, gatheredAmount, requiredAmount: funding.requiredAmount ?? project.requiredAmount ?? 0 };
    }),
  );

  return (
    <div className="flex flex-col">
      <HomeHero featuredProjects={featuredProjects} />
      <Projects isArchived={false} />
      <Blogs />
      <TrustedByContributors />
      <Donation />
      <Projects isArchived={true} />
    </div>
  );
}
