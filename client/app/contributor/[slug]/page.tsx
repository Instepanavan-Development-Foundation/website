import { Image } from "@nextui-org/image";
import { Card, CardBody } from "@nextui-org/card";
import getData from "@/src/helpers/getData";
import { IProject } from "@/src/models/project";
import getMediaSrc from "@/src/helpers/getMediaUrl";
import { IParams } from "@/src/models/params";

export default async function ContributorPage({ params }: IParams) {
  const { slug } = await params;

  const { data: projects }: { data: IProject[] } = await getData({
    type: "projects",
    populate: {
      blogs: {
        fields: ["id"],
        populate: ["contribution.contributor"],
      },
      image: {
        fields: ["url", "alternativeText"],
      },
    },
    filters: {
      blogs: {
        contribution: {
          contributor: {
            slug: slug,
          },
        },
      },
    },
  });
  const { contributor } = projects[0].blogs[0].contribution[0];

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-16">
        <div className="relative">
          <Image
            src={"https://i.pravatar.cc/150?img=1"} // TODO add gravatar
            alt={contributor.about}
            width={200}
            height={200}
            className="rounded-full"
          />
          <div className="absolute inset-0 rounded-full ring-4 ring-primary ring-offset-4 ring-offset-background" />
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-bold mb-2">{contributor.fullName}</h1>
          <p className="text-default-500 max-w-2xl">{contributor.about}</p>
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-bold mb-8">Նախագծեր</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects
            .filter((project) => !project.isArchived)
            .map((project) => (
              <Card // TODO maybe add link to the project?
                key={project.slug}
                className="hover:shadow-lg transition-shadow"
              >
                <CardBody>
                  <div className="flex flex-col md:flex-row gap-4">
                    <Image
                      src={getMediaSrc(project.image)}
                      alt={project.image.alternativeText || "project image"}
                      width={80}
                      height={80}
                      className="rounded-lg object-cover"
                    />
                    <div>
                      <p className="text-default-500 mb-1">
                        {/* TODO set date format */}
                        {project.createdAt}
                      </p>
                      <p className="mb-1">
                        {project.blogs[0].contribution[0].text}
                      </p>
                      <p className="mb-1">{project.name}</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
        </div>
      </div>
    </section>
  );
}
