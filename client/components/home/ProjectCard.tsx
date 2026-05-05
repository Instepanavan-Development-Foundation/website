import Image from "next/image";

import { ContributorsList } from "../ContributorsList";

import { IProject } from "@/src/models/project";
import getMediaUrl from "@/src/helpers/getMediaUrl";

export const formatCurrency = (amount: number, currency: string = "AMD") => {
  return new Intl.NumberFormat("hy-AM", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatCompact = (n: number) =>
  Math.round(n).toLocaleString("fr-FR");

const GRADIENTS = [
  "linear-gradient(135deg, #FFB088, #E65A2A)",
  "linear-gradient(135deg, #E65A2A, #C8367E)",
  "linear-gradient(135deg, #FFC9A0, #FF8A5C)",
  "linear-gradient(135deg, #FF8A5C, #B83875)",
  "linear-gradient(135deg, #FFB088, #FF8A5C, #E65A2A)",
];

export function ProjectCard({
  name,
  description,
  blogs,
  image,
  gatheredAmount: propGatheredAmount,
  requiredAmount: propRequiredAmount,
}: IProject) {
  const gatheredAmount = propGatheredAmount ?? 0;
  const requiredAmount = propRequiredAmount ?? 0;

  const percentComplete = requiredAmount
    ? Math.min(Math.round((gatheredAmount / requiredAmount) * 100), 100)
    : 100;

  const gradient = GRADIENTS[(name?.charCodeAt(0) ?? 0) % GRADIENTS.length];
  const hasImage = !!image?.url;

  return (
    <article className="group bg-white border border-cream-200 rounded-[20px] overflow-hidden transition-all duration-200 hover:shadow-[0_12px_32px_rgba(230,90,42,0.08)] hover:border-cream-300 h-full flex flex-col">
      {/* Inset cover */}
      <div className="relative m-1.5 rounded-[16px] overflow-hidden aspect-[4/3]">
        {hasImage ? (
          <Image
            fill
            alt={name}
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
            src={getMediaUrl(image)}
          />
        ) : (
          <div
            className="absolute inset-0 grid place-items-center p-6"
            style={{ background: gradient }}
          >
            <span className="text-white text-xl font-semibold text-center line-clamp-3 opacity-95">
              {name || "..."}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-5 pb-5 pt-1 flex flex-col grow">
        <h3 className="text-[19px] font-semibold tracking-tight text-ink line-clamp-1">
          {name}
        </h3>
        <p className="mt-2 text-[13.5px] leading-snug text-ink-muted line-clamp-2 min-h-[40px]">
          {description}
        </p>

        {requiredAmount > 0 && (
          <div className="mt-4">
            <div className="h-1.5 bg-cream-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between items-baseline text-[12px]">
              <span className="font-semibold text-ink">
                {formatCompact(gatheredAmount)} ֏
              </span>
              <span className="text-ink-muted">{percentComplete}%</span>
            </div>
          </div>
        )}

        {blogs && blogs.length > 0 && (
          <div className="mt-3 flex -space-x-2">
            <ContributorsList
              contributions={blogs
                .map(({ contribution }) => contribution)
                .flat()
                .filter((c, i, all) =>
                  i === all.findIndex((x) => x?.contributor?.documentId === c?.contributor?.documentId)
                )}
            />
          </div>
        )}
      </div>
    </article>
  );
}
