import MainProjectsHero from "@/components/home/MainProjectsHero";
import Projects from "@/components/home/Projects";
import Blogs from "@/components/home/Blogs";
import TrustedByContributors from "@/components/home/TrustedByContributors";
import Donation from "@/components/home/Donation";
import getData from "@/src/helpers/getData";
import { IProject } from "@/src/models/project";

export default async function Home() {
  // Fetch main projects for hero section
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

  return (
    <section className="flex flex-col items-center px-4">
      <MainProjectsHero projects={mainProjects} />
      <Projects isArchived={false} />
      <Blogs />
      <TrustedByContributors />
      <Donation />
      <Projects isArchived={true} />
    </section>
  );
}
