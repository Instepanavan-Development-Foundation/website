import Link from "next/link";
import { button as buttonStyles } from "@nextui-org/theme";
import { MoveRight, Rss } from "lucide-react";
import { Chip } from "@nextui-org/chip";
import { Button } from "@nextui-org/button";
import Markdown from "react-markdown";
import { Progress } from "@heroui/progress";

import { BlogPost } from "@/components/BlogPost";
import { ContributorsList } from "@/components/ContributorsList";
import getData from "@/src/helpers/getData";
import { IProject } from "@/src/models/project";
import { IParams } from "@/src/models/params";
import NotFound from "@/components/NotFound";
import { ContributionBox } from "@/components/ContributionBox";
import Supporters from "@/components/Supporters";
import Carousel from "@/components/Carousel";
import { formatCurrency } from "@/components/home/ProjectCard";
import getMediaSrc from "@/src/helpers/getMediaUrl";
import ModifiedMarkdown from "@/src/hok/modifiedMarkdown";

export async function generateMetadata({ params }: IParams) {
  const { slug } = await params;
  const { data }: { data: IProject[] } = await getData({
    type: "projects",
    filters: {
      slug,
    },
    fields: ["name", "description"],
    populate: {
      image: {
        fields: ["url"],
      },
    },
  });

  const [project] = data;
  if (!project) {
    return;
  }

  return {
    title: project.name,
    description: project.description,
    openGraph: {
      type: "website",
      images: { url: getMediaSrc(project.image) },
    },
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
        // TODO: Add pagination limit
      },
      image: {
        fields: ["url", "alternativeText", "name"],
      },
      slider: {
        populate: ["images"],
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
  
  const percentComplete = project.requiredAmount ? Math.round((project.gatheredAmount / project.requiredAmount) * 100) : 100;
  const isUrgent = percentComplete < 30 && !project.isArchived;
  
  // Determine progress color based on completion percentage
  const progressColor = project.gatheredAmount >= project.requiredAmount 
    ? "success" 
    : project.gatheredAmount >= project.requiredAmount / 2 
      ? "primary" 
      : "danger";

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
      <div className="relative container mb-16">
        <div className="relative">
          <Carousel slider={project.slider} image={project.image} />
          {isUrgent && (
            <div className="absolute top-4 left-4 bg-danger text-white text-sm font-bold px-3 py-1.5 rounded-full animate-pulse z-20">
              Հրատապ օգնության կարիք
            </div>
          )}
        </div>
        <div className=" inset-0 flex flex-col items-center justify-center p-4 z-10">
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
          <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-xl p-8 shadow-md">
            <h2 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400">
              Ֆինանսավորում
            </h2>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xl text-default-600">
                {formatCurrency(project.gatheredAmount)} հավաքված է
              </span>
              <span className="text-lg text-default-500">
                Նպատակ: {formatCurrency(project.requiredAmount)}
              </span>
            </div>
            
            {/* HeroUI Progress Component */}
            <Progress 
              value={percentComplete} 
              color={progressColor}
              size="lg"
              showValueLabel={false}
              className="my-2"
              aria-label="Funding progress"
            />

            {/* Contributors Preview */}
            <div className="mt-6 flex items-center gap-2 justify-between">
              <div className="text-default-500">
                {percentComplete}% աջակիցների կողմից
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
        {project.about && (
        <>
        <h2 className="text-3xl font-bold mb-8">Ծրագրի մանրամասներ</h2>
        <div className="prose prose-lg max-w-none">
          <ModifiedMarkdown>{project.about}</ModifiedMarkdown>
          </div>
        </>
      )}
        <div className="flex justify-center">
          <ContributionBox project={project} />
        </div>
      </div>

      <Supporters
        contributors={project.blogs.map((blog) => blog.contribution).flat()}
      />
    </section>
  );
}
