"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";

import getData from "@/src/helpers/getData";
import { IProject } from "@/src/models/project";

export default function Donation() {
  const [featuredProject, setFeaturedProject] = useState<IProject | null>(null);

  useEffect(() => {
    const fetchFeaturedProject = async () => {
      try {
        const { data } = await getData({
          type: "projects",
          filters: {
            isFeatured: true,
            isArchived: false,
          },
          limit: 1,
        });

        if (data && data.length > 0) {
          setFeaturedProject(data[0]);
        }
      } catch (error) {
        console.error("Error fetching featured project:", error);
      }
    };

    fetchFeaturedProject();
  }, []);

  const impactCards = [
    {
      value: "100%",
      label: "Ձեր աջակցությունն ուղիղ՝ ծրագրերին",
      accent: "primary" as const,
    },
    {
      value: "1,000+",
      label: "Մարդիկ, ում կյանքը փոխվել է",
      accent: "ink" as const,
    },
    {
      value: "10+",
      label: "Ավարտված ծրագրեր համայնքներում",
      accent: "primary" as const,
    },
  ];

  return (
    <section className="w-full my-12 md:my-16">
      <div className="bg-cream-100 rounded-[28px] p-8 md:p-12">
        <div className="max-w-2xl">
          <div className="text-[11px] font-medium tracking-[0.14em] text-primary uppercase mb-2">
            ԱՋԱԿՑԵԼ
          </div>
          <h2 className="text-[28px] md:text-[40px] font-semibold leading-[1.1] tracking-tightest text-ink">
            Աջակցեք մեր <span className="text-primary">առաքելությանը</span>
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-ink-body">
            Ձեր ներդրումն օգնում է մեզ շարունակել կառուցել ուժեղ համայնք։
            Յուրաքանչյուր աջակցություն փոփոխություն է բերում։
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {impactCards.map((c) => (
            <div
              key={c.label}
              className="bg-white rounded-[20px] p-5 border border-cream-200"
            >
              <div
                className={`text-[32px] font-semibold tracking-tighter2 leading-none ${
                  c.accent === "primary" ? "text-primary" : "text-ink"
                }`}
              >
                {c.value}
              </div>
              <p className="mt-2 text-[13.5px] text-ink-muted leading-snug">
                {c.label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            className="inline-flex items-center gap-1.5 bg-primary text-white px-7 py-3.5 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors"
            href={
              featuredProject ? `/donate/${featuredProject.slug}` : "/projects"
            }
          >
            Աջակցել հիմա
            <Heart className="fill-white" size={16} />
          </Link>
          <Link
            className="text-sm text-ink font-medium hover:text-primary transition-colors"
            href="/finances"
          >
            Տեսնել մեր ֆինանսները →
          </Link>
        </div>
      </div>
    </section>
  );
}
