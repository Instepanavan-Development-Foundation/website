import { Image } from "@nextui-org/image";
import { Card, CardBody } from "@nextui-org/card";
import { Link } from "@nextui-org/link";
import getData from "@/src/helpers/getData";
import { IContributor } from "@/src/models/contributor";

// Mock data for the contributor (in real app, this would come from an API/database)
const contributorData = {
  // role: "Ծրագրի ղեկավար",
  avatar: "https://i.pravatar.cc/150?img=1",
  projects: [
    {
      title: "Խռողջապահական տեխնոլոգիաներ",
      contribution: "Առաջնորդել է ծրագրի զարգացումը",
      image:
        "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=80&h=80&fit=crop", // Smaller image
      status: "Ընթացիկ",
      date: "2023-01-15", // New contribution date
    },
    {
      title: "Կայուն ապագայի կառուցում",
      contribution: "Ռազմավարական պլանավորում",
      image:
        "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=80&h=80&fit=crop", // Smaller image
      status: "Ավարտված",
      date: "2022-05-10", // New contribution date
    },
    {
      title: "Տվյալների վերլուծություն",
      contribution: "Անալիզի ղեկավար",
      image:
        "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=80&h=80&fit=crop", // Smaller image
      status: "Ավարտված",
      date: "2021-09-20", // New contribution date
    },
    {
      title: "Համայնքային զարգացում",
      contribution: "Ծրագրի ղեկավար",
      image:
        "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=80&h=80&fit=crop", // Smaller image
      status: "Ընթացիկ",
      date: "2023-03-05", // New contribution date
    },
  ],
};

// TODO move to global interface, all params are the same
interface IContributorParams {
  params: { slug: string };
}

export default async function ContributorPage({ params }: IContributorParams) {
  const { slug } = await params;
  const { data }: { data: IContributor[] } = await getData({
    type: "contributors",
    slug: slug,
  });

  const contributor = data[0];
  if (!contributor) {
    return null; // TODO not found component
  }
  console.log(contributor);

  return (
    <section className="container mx-auto px-4 py-8">
      {/* Profile Section */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-16">
        <div className="relative">
          <Image
            src={contributorData.avatar} // TODO add gravatar
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

      {/* TODO add projects by query */}
      <div>
        <h2 className="text-3xl font-bold mb-8">Նախագծեր</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {contributorData.projects
            .filter((project) => project.status === "Ընթացիկ")
            .map((project, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardBody>
                  <div className="flex flex-col md:flex-row gap-4">
                    <Image
                      src={project.image}
                      alt={project.title}
                      width={80} // Smaller image size
                      height={80} // Smaller image size
                      className="rounded-lg object-cover"
                    />
                    <div>
                      <p className="text-default-500 mb-1">{project.date}</p>
                      <p className="mb-1">{project.contribution}</p>
                      <p className="mb-1">{project.title}</p>
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
