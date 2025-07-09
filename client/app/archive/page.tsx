import Link from "next/link";

import getData from "@/src/helpers/getData";
import { IProject } from "@/src/models/project";
import { ProjectCard } from "@/components/home/ProjectCard";

export const metadata = {
  title: "Արխիվացված նախագծեր",
  description: "Instepanavan հիմնադրամի արխիվացված նագագծեր",
};

export default async function Home() {
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
    filters: {
      isArchived: true,
    },
  });

  return (
    <section className="flex flex-col px-4">
      {/* Projects Section */}
      <div className="w-full container my-8">
        <h2 className="text-3xl font-bold mb-6">Ավարտված նախագծեր</h2>
        <p className="mb-6">
          {" "}
          Այս նագագծերը ավարտված են, և այլևս չեն թարմացվում։
        </p>
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {projects.map((project, index) => (
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
