import { Link } from "@nextui-org/link";
import { button as buttonStyles } from "@nextui-org/theme";
import { Image } from "@nextui-org/image";

import { ProjectCard } from "../components/home/ProjectCard";
import { BlogPost } from "../components/BlogPost";
import { HeroSection } from "../components/home/HeroSection";
import getData from "@/src/helpers/getData";
import { IProject } from "@/src/models/project";
import { IBlog } from "@/src/models/blog";
import { IStaticPage } from "@/src/models/stat-page";
import { Button } from "@nextui-org/button";
import { Archive, Rss } from "lucide-react";

// TODO move to backend
const stats = [
  { label: "Իրականացված ծրագրեր", value: "25+" }, // projects?
  { label: "Համայնքներ", value: "40+" }, // ?
  { label: "Շահառուներ", value: "10,000+" }, // ?
  { label: "Կամավորներ", value: "150+" }, // contributors?
];

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
      isArchived: false,
    },
  });

  const { data: blogs }: { data: IBlog[] } = await getData({
    type: "blogs",
    populate: {
      images: { fields: ["url"] },
      project: { fields: ["name", "slug"] },
      contribution: { populate: ["contributor.avatar"] },
      attachments: { fields: ["url", "name"] },
    },
    sort: "createdAt:desc",
  });

  const { data: staticPages }: { data: IStaticPage[] } = await getData({
    type: "static-pages",
    filters: { slug: "about" },
  });

  const aboutContent = staticPages[0];

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <section className="flex flex-col items-center px-4">
      {/* TODO move to backend */}
      <HeroSection
        title="Մենք նվիրված ենք տեխնոլոգիական լուծումների միջոցով հայկական համայնքների զարգացմանը:"
        description="Մենք նվիրված ենք տեխնոլոգիական լուծումների միջոցով հայկական համայնքների զարգացմանը:"
        ctaText="Գնալ արխիվ"
        ctaLink="/blog"
        imageUrl="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop"
      />

      {/* Projects Section */}
      <div className="w-full container my-8">
        <h2 className="text-3xl font-bold mb-6">Ակտիվ նախագծեր</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {projects.map((project, index) => (
            <Link href={`/project/${project.slug}`} key={index}>
              <ProjectCard key={index} {...project} />
            </Link>
          ))}
        </div>
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
      </div>

      <div className="w-full max-w-7xl my-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold mb-6">Մեր աշխատանքը</h2>
          <Link
            href={`${process.env.NEXT_PUBLIC_BACKEND_URL}${process.env.NEXT_PUBLIC_RSS_URL}`}
            target="_blank"
          >
            <Button variant="bordered" color="warning">
              <Rss className="w-4 h-4" />
              RSS
            </Button>
          </Link>
        </div>
        <div className="gap-6 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4">
          {blogs.length > 0 ? (
            blogs.map((post, index) => <BlogPost key={index} {...post} />)
          ) : (
            <p>Աշխատանքներ չկան</p>
          )}
        </div>
        <div className="col-span-full flex justify-center mt-8">
          <Link
            href="/blog"
            className={buttonStyles({
              variant: "flat",
              radius: "full",
              size: "lg",
            })}
          >
            Դիտել բոլոր հոդվածները
            <svg
              className="ml-2 w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
        </div>
      </div>

      {/* About Us Section */}
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
            <h2 className="text-4xl font-bold mb-6">{aboutContent.title}</h2>
            <p className="text-default-600 text-lg mb-8">
              {aboutContent.description}
            </p>
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

      {/* Donation Section */}
      <div className="w-full container my-16 text-center">
        <h2 className="text-4xl font-bold mb-4">Աջակցեք մեր առաքելությանը</h2>
        <p className="text-default-500 text-xl mb-8 max-w-2xl mx-auto">
          Ձեր ներդրումն օգնում է մեզ շարունակել նորարարական լուծումների
          կառուցումը և աջակցել մեր համայնքին: Յուրաքանչյուր նվիրատվություն
          տարբերություն է ստեղծում:
        </p>
        <Link
          href="#"
          className={buttonStyles({
            color: "success",
            radius: "full",
            variant: "shadow",
            size: "lg",
          })}
        >
          <span className="text-xl px-8 py-2">Նվիրաբերել հիմա</span>
        </Link>
      </div>
    </section>
  );
}
