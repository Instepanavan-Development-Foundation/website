import { Link } from "@nextui-org/link";
import { Image } from "@nextui-org/image";
import { button as buttonStyles } from "@nextui-org/theme";
import { MoveRight } from "lucide-react";
import { BlogPost } from "@/components/BlogPost";
import { ContributorsList } from "../../../components/ContributorsList";
import getData from "@/src/helpers/getData";
import getImageSrc from "@/src/helpers/getImageSrc";
import { IProject } from "@/src/models/project";

interface IProjectPageParams {
  params: { slug: string };
}

export default async function ProjectPage({ params }: IProjectPageParams) {
  const { slug } = await params;
  const { data }: { data: IProject[] } = await getData({
    type: "projects",
    populate: {
      blogs: ["images", "contribution.member"],
      image: [],
    },
    slug: slug,
  });

  const project = data[0];

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <section className="flex flex-col px-4">
      {/* Hero Section */}
      <div className="relative container h-[600px] mb-16">
        <Image
          alt="Project Cover"
          className="w-full h-full object-cover brightness-50"
          src={getImageSrc(project.image)}
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

      {/* Project Details */}
      <div className="container mb-16">
        {/* Funding Progress */}
        <div className="bg-default-50 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-4">Ֆինանսավորում</h2>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xl text-default-600">
              {formatCurrency(30000, "USD")} raised
            </span>
            <span className="text-lg text-default-500">
              Goal: {formatCurrency(50000, "USD")}
            </span>
          </div>
          <div className="w-full h-3 bg-default-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 rounded-full"
              style={{
                width: `${Math.min(100, (30000 / 50000) * 100)}%`,
              }}
            />
          </div>

          {/* Contributors Preview */}
          <div className="mt-6 flex items-center gap-2 justify-between">
            <div className="text-default-500">
              {Math.round((30000 / 50000) * 100)}% funded by
            </div>
            <ContributorsList contributors={project.blogs[0].contribution} />
            {/* TODO fetch all contributions */}
          </div>
        </div>
      </div>

      {/* Related Blog Posts */}
      <div className="container mb-16">
        <h2 className="text-3xl font-bold mb-6">Մեր աշխատանքը</h2>
        <div className="gap-6 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4">
          {project.blogs.map((blog, index) => (
            <BlogPost key={index} {...blog} />
          ))}
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
            <MoveRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </div>

      <div className="container mb-16">
        <h2 className="text-3xl font-bold mb-8">Միջոցառումներ</h2>
        <Image
          src="https://dummyimage.com/600x400/000000/ffffff"
          alt="Dummy Calendar Image"
          width={600}
          height={400}
          className="w-full"
        />
      </div>
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

      {/* Contributors Section */}
      <div className="container mb-16" id="contributors">
        <h2 className="text-3xl font-bold mb-8">Աջակիցներ</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {project.blogs[0].contribution.map((contributor, index) => (
            <div
              key={index}
              className="flex items-center p-3 bg-default-50 rounded-xl hover:bg-default-100 transition-colors relative"
            >
              {contributor.isFeatured && (
                <div className="absolute -top-2 -right-2 bg-warning-400 text-white rounded-full p-1">
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              )}
              <div className="relative min-w-[50px]">
                <Image
                  src={"https://dummyimage.com/600x400/000000/ffffff"}
                  alt={contributor.member.fullName}
                  width={50}
                  height={50}
                  className="rounded-full object-cover"
                />
                <div className="absolute inset-0 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-background" />
              </div>
              <div className="">
                <p className="p-3">
                  {contributor.member.fullName}՝ {contributor.text}
                </p>
              </div>
            </div>
          ))}
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
            Բեռնել ավել
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
    </section>
  );
}
