import { Link } from "@nextui-org/link";
import { Image } from "@nextui-org/image";
import { button as buttonStyles } from "@nextui-org/theme";
import { MoveRight, Rss } from "lucide-react";
import { Chip } from "@nextui-org/chip";
import { Button } from "@nextui-org/button";

import { BlogPost } from "@/components/BlogPost";
import { ContributorsList } from "@/components/ContributorsList";
import getData from "@/src/helpers/getData";
import getMediaUrl from "@/src/helpers/getMediaUrl";
import { IProject } from "@/src/models/project";
import { IParams } from "@/src/models/params";
import NotFound from "@/components/NotFound";
import { ContributionBox } from "@/components/ContributionBox";
import Supporters from "@/components/Supporters";

export async function generateMetadata({ params }: IParams) {
  const { slug } = await params;
  const { data }: { data: IProject[] } = await getData({
    type: "projects",
    filters: {
      slug,
    },
  });

  const [project] = data;
  if (!project) {
    return;
  }

  return {
    title: project.name,
    description: project.description,
  };
}

export default async function ProjectPage({ params }: IParams) {
  const { slug } = await params;
  const { data }: { data: IProject[] } = await getData({
    type: "projects",
    populate: {
      blogs: {
        populate: [
          "images",
          "contribution.contributor.avatar",
          "attachments",
          "project",
        ],
        sort: ["isFeatured:desc", "createdAt:desc"],
      },
      image: {
        fields: ["url", "alternativeText", "name"],
      },
    },
    filters: {
      slug,
    },
  });

  const project = data[0];
  if (!project) {
    return <NotFound />;
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <section className="flex flex-col px-4">
      {/* Archive indicator */}
      {project.isArchived && (
        <Chip
          radius="sm"
          color="warning"
          variant="shadow"
          className="w-full mb-4 max-w-full text-lg p-4"
        >
          Այս նախագծը արխիվում է, նախագծի մասին տեղեկությունները այլևս չեն
          թարմացվում։
        </Chip>
      )}

      {/* Hero Section */}
      <div className="relative container h-[600px] mb-16">
        <Image
          alt="Project Cover"
          className="w-full h-full object-cover brightness-50"
          src={getMediaUrl(project.image)}
          width={1920}
          height={600}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 z-10">
          <h1 className="text-5xl md:text-6xl font-bold text-center mb-6">
            {project.name}
          </h1>
          <p className="text-xl md:text-2xl text-center max-w-3xl mb-8">
            {project.description}
          </p>

          <ContributionBox project={project} />
        </div>
      </div>

      {/* Project Details */}
      {project.gatheredAmount && project.requiredAmount && (
        <div className="container mb-16">
          {/* Funding Progress */}
          <div className="bg-default-50 rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-4">Ֆինանսավորում</h2>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xl text-default-600">
                {formatCurrency(project.gatheredAmount, "USD")} raised
              </span>
              <span className="text-lg text-default-500">
                Goal: {formatCurrency(project.requiredAmount, "USD")}
              </span>
            </div>
            <div className="w-full h-3 bg-default-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 rounded-full"
                style={{
                  width: `${Math.min(100, (project.gatheredAmount / project.requiredAmount) * 100)}%`,
                }}
              />
            </div>

            {/* Contributors Preview */}
            <div className="mt-6 flex items-center gap-2 justify-between">
              <div className="text-default-500">
                {Math.round(
                  (project.gatheredAmount / project.requiredAmount) * 100
                )}
                % աջակիցների կողմից
              </div>
              <ContributorsList
                contributions={project.blogs
                  .map((blog) => blog.contribution)
                  .flat()}
              />
            </div>
          </div>
        </div>
      )}

      {/* Related Blog Posts */}
      <div className="container mb-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold mb-6">Մեր աշխատանքը</h2>
          <Link
            href={`${process.env.NEXT_PUBLIC_BACKEND_URL}${process.env.NEXT_PUBLIC_RSS_URL}?project=${project.slug}`}
            target="_blank"
          >
            <Button variant="bordered" color="warning">
              <Rss className="w-4 h-4" />
              RSS
            </Button>
          </Link>
        </div>
        <div className="gap-6 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4">
          {project.blogs.map((blog, index) => (
            <BlogPost key={index} {...blog} />
          ))}
        </div>
        <div className="col-span-full flex justify-center mt-8">
          <Link
            href={`/blog?project=${project.name}`}
            className={buttonStyles({
              variant: "flat",
              radius: "full",
              size: "lg",
            })}
          >
            Դիտել նախագծի բոլոր հոդվածները
            <MoveRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Events Section */}
      {project.events && (
        <div className="container mb-16">
          <h2 className="text-3xl font-bold mb-8">Միջոցառումներ</h2>
          <div
            className="text-container"
            dangerouslySetInnerHTML={{ __html: project.events }}
          />
        </div>
      )}

      {/* Project Details Section */}
      <div className="container mb-16">
        <h2 className="text-3xl font-bold mb-8">Ծրագրի մանրամասներ</h2>
        <div className="prose prose-lg max-w-none">
          <p className="text-default-600 mb-6">{project.about}</p>
        </div>
        <div className="flex justify-center mt-8">
          <Link
            href="#"
            className={buttonStyles({
              color: "success",
              radius: "full",
              variant: "shadow",
              size: "lg",
            })}
          >
            <span className="text-xl px-8 py-2">Աջակցել նախագծին</span>
          </Link>
        </div>
      </div>

      <Supporters
        contributors={project.blogs.map((blog) => blog.contribution).flat()}
      />
    </section>
  );
}
