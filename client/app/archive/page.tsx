import { Link } from "@nextui-org/link";

import getData from "@/src/helpers/getData";
import { IProject } from "@/src/models/project";
import { ProjectCard } from "@/components/home/ProjectCard";

export default async function Home() {
  const { data: projects }: { data: IProject[] } = await getData({
    type: "projects",
    populate: {
      image: { fields: ["url"] },
      blogs: {
        populate: ["contribution.contributor"],
      },
    },
    filters: {
      isArchived: { $eq: true }
    }
  });


  return (
    <section className="flex flex-col px-4">
      {/* Projects Section */}
      <div className="w-full container my-8">
        <h2 className="text-3xl font-bold mb-6">Ակտիվ նախագծեր</h2>
        {projects.length > 0 ?
          (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {projects.map((project, index) => (
              <Link href={`/project/${project.slug}`} key={index}>
                <ProjectCard key={index} {...project} />
              </Link>
            ))}
          </div>) :
          (<p>Արխիվացված նախագծեր չկան</p>)
        }
      </div>
    </section>
  );
}
