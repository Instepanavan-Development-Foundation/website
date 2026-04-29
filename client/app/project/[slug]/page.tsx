import Link from "next/link";
import { Rss, MoveRight } from "lucide-react";
import { Button } from "@heroui/button";

import { BlogPost } from "@/components/BlogPost";
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
import getProjectFunding from "@/src/helpers/getProjectFunding";

export async function generateMetadata({ params }: IParams) {
  const { slug } = await params;
  const { data }: { data: IProject[] } = await getData({
    type: "projects",
    filters: { slug },
    fields: ["name", "description"],
    populate: { image: { fields: ["url"] } },
  });

  const [project] = data;

  if (!project) return;

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
        populate: ["images", "contribution.contributor.avatar", "attachments", "project"],
        sort: ["isFeatured:desc", "createdAt:desc"],
      },
      image: { fields: ["url", "alternativeText", "name"] },
      slider: { populate: ["images"] },
    },
    filters: { slug },
  });

  const project = data[0];

  if (!project) return <NotFound />;

  const funding = await getProjectFunding(project.documentId);

  let gatheredAmount = 0;
  if (funding) {
    if (funding.donationType === "recurring") {
      gatheredAmount = funding.currentMonth.recurring.amount;
    } else {
      gatheredAmount = funding.allTime.oneTime.amount;
    }
  }
  const requiredAmount = funding?.requiredAmount ?? 0;
  const percentComplete = requiredAmount > 0
    ? Math.min(Math.round((gatheredAmount / requiredAmount) * 100), 100)
    : 0;
  const isUrgent = percentComplete < 30 && !project.isArchived && requiredAmount > 0;

  const statusTag = project.isArchived
    ? "Ավարտված"
    : isUrgent
      ? "Հրատապ"
      : "Ակտիվ";

  const hasImage = !!(project.image?.url || project.slider);

  return (
    <div className="pb-16">

      {/* Archive banner */}
      {project.isArchived && (
        <div className="mb-10 bg-cream-100 rounded-[20px] px-6 py-4 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-ink-meta shrink-0" />
          <p className="text-sm text-ink-muted">
            Այս նախագծն ավարտված է — տեղեկությունները այլևս չեն թարմացվում։
          </p>
        </div>
      )}

      {/* ── Hero ── */}
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start mb-12 md:mb-16">

        {/* Left: text */}
        <div className="flex flex-col">
          {/* Status pill */}
          <div className={`self-start inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 ${
            isUrgent
              ? "bg-ink text-white"
              : project.isArchived
                ? "bg-cream-200 text-ink-muted"
                : "bg-cream-100 text-primary"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isUrgent ? "bg-white" : project.isArchived ? "bg-ink-meta" : "bg-primary"}`} />
            {statusTag}
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-[56px] font-semibold leading-[1.05] tracking-tight text-ink mb-5">
            {project.name}
          </h1>

          <p className="text-[17px] leading-relaxed text-ink-body mb-8 max-w-lg">
            {project.description}
          </p>

          <div className="flex flex-wrap gap-3">
            <ContributionBox project={project} />
          </div>
        </div>

        {/* Right: image card */}
        <div className="relative">
          <div className="bg-cream-100 rounded-[28px] p-1.5 overflow-hidden">
            <div className="rounded-[22px] overflow-hidden aspect-[4/3] bg-cream-200">
              {hasImage ? (
                <Carousel image={project.image} slider={project.slider} />
              ) : (
                <div
                  className="w-full h-full"
                  style={{ background: "linear-gradient(135deg,#FFB088,#E65A2A 55%,#B83875)" }}
                />
              )}
            </div>
          </div>

          {/* Stat badge */}
          {gatheredAmount > 0 && (
            <div className="absolute -top-4 -right-4 bg-white rounded-[20px] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.08)] border border-cream-200">
              <div className="text-[11px] text-ink-meta mb-1">Հավաքված</div>
              <div className="text-2xl font-semibold text-primary tracking-tight leading-none">
                {formatCurrency(gatheredAmount)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Funding progress ── */}
      {requiredAmount > 0 && (
        <div className="bg-cream-100 rounded-[28px] p-8 md:p-10 mb-12 md:mb-16">
          <div className="text-[11px] font-medium tracking-[0.14em] text-primary uppercase mb-1.5">
            ՖԻՆԱՆՍԱՎՈՐՈՒՄ
          </div>
          <h2 className="text-2xl font-semibold text-ink tracking-tight mb-6">
            Հավաքագրման ընթացք
          </h2>

          <div className="flex justify-between items-baseline mb-3 text-sm">
            <span className="font-semibold text-ink text-lg">
              {formatCurrency(gatheredAmount)}{" "}
              <span className="text-ink-muted font-normal text-sm">
                {project.donationType === "recurring" ? "ամսական" : "հավաքված"}
              </span>
            </span>
            <span className="text-ink-muted">
              Նպատակ՝ {formatCurrency(requiredAmount)}
            </span>
          </div>

          <div className="h-2 bg-cream-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${percentComplete}%` }}
            />
          </div>

          <div className="mt-3 text-sm text-ink-muted">{percentComplete}%</div>
        </div>
      )}

      {/* ── Blog posts ── */}
      {project.blogs?.length > 0 && (
        <div className="mb-12 md:mb-16">
          <div className="flex items-baseline justify-between mb-6 md:mb-8">
            <div>
              <div className="text-[11px] font-medium tracking-[0.14em] text-primary uppercase mb-1.5">
                ՀԱՇՎԵՏՎՈՒԹՅՈՒՆ
              </div>
              <h2 className="text-[28px] md:text-[32px] font-semibold tracking-tight text-ink">
                Մեր աշխատանքը
              </h2>
            </div>
            <Link
              href={`${process.env.NEXT_PUBLIC_BACKEND_URL}${process.env.NEXT_PUBLIC_RSS_URL}?project=${project.slug}`}
              target="_blank"
            >
              <Button color="primary" size="sm" variant="bordered">
                <Rss className="w-3.5 h-3.5" />
                RSS
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {project.blogs.map((blog, index) => (
              <BlogPost key={index} {...blog} />
            ))}
          </div>

          <div className="flex justify-center mt-8">
            <Link
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium text-ink bg-cream-100 hover:bg-cream-200 transition-colors"
              href={`/blog?project=${project.name}`}
            >
              Դիտել նախագծի բոլոր հոդվածները
              <MoveRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* ── Events ── */}
      {project.events && (
        <div className="mb-12 md:mb-16">
          <div className="text-[11px] font-medium tracking-[0.14em] text-primary uppercase mb-1.5">
            ՄԻՋՈՑԱՌՈՒՄՆԵՐ
          </div>
          <h2 className="text-[28px] md:text-[32px] font-semibold tracking-tight text-ink mb-6">
            Միջոցառումներ
          </h2>
          <div
            className="text-container text-ink-body"
            dangerouslySetInnerHTML={{ __html: project.events }}
          />
        </div>
      )}

      {/* ── About ── */}
      {project.about && (
        <div className="mb-12 md:mb-16">
          <h2 className="text-[28px] md:text-[32px] font-semibold tracking-tight text-ink mb-6">
            Ծրագրի մասին
          </h2>
          <div className="prose prose-lg max-w-none text-ink-body">
            <ModifiedMarkdown>{project.about}</ModifiedMarkdown>
          </div>
          <div className="mt-8 flex">
            <ContributionBox project={project} />
          </div>
        </div>
      )}

      {/* ── Supporters ── */}
      <Supporters
        contributors={project.blogs?.map((blog) => blog.contribution).flat() ?? []}
      />
    </div>
  );
}
