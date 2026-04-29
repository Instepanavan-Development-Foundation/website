"use client";

import Link from "next/link";

import HomeHeroSlide from "./HomeHeroSlide";

import EmblaCarousel from "@/components/EmblaCarousel";
import { IProject } from "@/src/models/project";

interface HomeHeroProps {
  featuredProjects: IProject[];
  supportersCount?: string;
}

export default function HomeHero({
  featuredProjects,
  supportersCount,
}: HomeHeroProps) {
  const projects = featuredProjects ?? [];
  const hasProjects = projects.length > 0;
  const hasMany = projects.length > 1;

  return (
    <section className="w-full pt-8 md:pt-12 pb-8 md:pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
        {/* LEFT: headline */}
        <div className="flex flex-col">
          <div className="inline-flex items-center gap-2 bg-cream-100 rounded-full px-3.5 py-1.5 text-xs font-medium text-primary w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Լոռու մարզ · Հայաստան
          </div>

          <h1 className="mt-5 font-semibold leading-[1.05] tracking-tightest text-ink text-[clamp(40px,6vw,72px)]">
            Ստեփանավանը <span className="text-primary">փոխվում</span> է — ձեր ձեռքերով։
          </h1>

          <p className="mt-6 text-[17px] leading-relaxed text-ink-body max-w-[520px]">
            Բաց, թափանցիկ, հաշվետու։ Համայնքային հիմնադրամ, որ գրադարաններ,
            երիտասարդական կենտրոններ ու մարդասիրական ծրագրեր է կյանքի կոչում
            — ամեն ծախս հրապարակային։
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="inline-flex items-center bg-ink text-white px-6 py-3.5 rounded-full text-sm font-medium hover:bg-ink-body transition-colors"
              href="/#projects"
            >
              Տեսնել նախագծերը
            </Link>
            <Link
              className="inline-flex items-center gap-1 text-ink px-6 py-3.5 rounded-full text-sm font-medium hover:bg-cream-100 transition-colors"
              href="/blog"
            >
              Մեր աշխատանքը
              <span aria-hidden>↗</span>
            </Link>
          </div>
        </div>

        {/* RIGHT: gradient art card(s) */}
        <div className="relative">
          {hasProjects ? (
            hasMany ? (
              <EmblaCarousel
                autoplay
                autoplayDelay={6000}
                loop
                showArrows={false}
                showDots
              >
                {projects.map((p) => (
                  <HomeHeroSlide key={p.documentId} project={p} />
                ))}
              </EmblaCarousel>
            ) : (
              <HomeHeroSlide project={projects[0]} />
            )
          ) : (
            <HomeHeroSlide />
          )}

          {/* Floating supporters card */}
          {supportersCount && (
            <div className="absolute -top-4 -right-4 md:-top-5 md:-right-5 z-20 bg-white rounded-[20px] p-4 border border-cream-200 shadow-[0_12px_32px_rgba(0,0,0,0.08)]">
              <div className="text-[11px] text-ink-meta">Աջակիցներ</div>
              <div className="text-[28px] leading-none font-semibold text-primary tracking-tighter2 mt-1">
                {supportersCount}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
