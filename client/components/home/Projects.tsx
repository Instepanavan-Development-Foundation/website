import Link from "next/link";
import { IProject } from "@/src/models/project";
import getData from "@/src/helpers/getData";
import { ProjectCard } from "./ProjectCard";

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

  return (
    <>
      {projects.length > 0 && (
        <div className="w-full container my-8">
          <h2 className="text-3xl font-bold mb-6">
            {isArchived ? "Ավարտված" : "Ակտիվ"} նախագծեր
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {projects.map((project, index) => (
              <Link href={`/project/${project.slug}`} key={index}>
                <ProjectCard key={index} {...project} />
              </Link>
            ))}
          </div>
        </div>
      )}
      {/* commenting archive button, maybe uncomment in Future?*/}
      {/* {!isArchived ? (
        <div className="flex justify-center mt-8">
          <Link
            href="/archive"
            className={buttonStyles({
              variant: "flat",
              radius: "full",
              size: "lg",
            })}
          >
            <Archive className="w-5 h-5" />
            Գնալ արխիվ
          </Link>
        </div>
      ) : null} */}
    </>
  );
}
