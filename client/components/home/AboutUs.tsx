import { Image } from "@heroui/image";
import getData from "@/src/helpers/getData";
import { IStaticPage } from "@/src/models/stat-page";

// TODO move to backend
const stats = [
  { label: "Իրականացված ծրագրեր", value: "25+" }, // projects?
  { label: "Համայնքներ", value: "40+" }, // ?
  { label: "Շահառուներ", value: "10,000+" }, // ?
  { label: "Կամավորներ", value: "150+" }, // contributors?
];

export default async function AboutUs() {
  const { data: staticPages }: { data: IStaticPage[] } = await getData({
    type: "static-pages",
    filters: { slug: "about" },
    fields: ["title", "description"],
  });

  const [aboutContent] = staticPages;
  if (!aboutContent) {
    return null;
  }

  const { title, description } = aboutContent;

  return (
    <div className="w-full container my-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="relative">
          <Image
            alt="Our Team"
            className="rounded-xl shadow-lg"
            src={
              "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop" // TODO there is no about image on the backend?
            }
            width={800}
            height={400}
          />
          <div className="absolute inset-0 bg-primary/10 rounded-xl" />
        </div>
        <div>
          <h2 className="text-4xl font-bold mb-6">{title}</h2>
          {/* TODO: wrap by ModifiedMarkdown component, handle image */}
          <p className="text-default-600 text-lg mb-8">{description}</p> 
          <div className="grid grid-cols-2 gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="p-4 bg-default-50 rounded-lg text-center"
              >
                <div className="text-3xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-default-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
