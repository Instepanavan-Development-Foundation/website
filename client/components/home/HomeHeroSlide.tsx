import Link from "next/link";

import { InLogo } from "@/components/icons/InLogo";
import { IProject } from "@/src/models/project";
import getMediaUrl from "@/src/helpers/getMediaUrl";

const formatCompact = (n: number) =>
  Math.round(n).toLocaleString("fr-FR");

interface HomeHeroSlideProps {
  project?: IProject;
}

export default function HomeHeroSlide({ project }: HomeHeroSlideProps) {
  const gatheredAmount = project?.gatheredAmount ?? 0;
  const requiredAmount = project?.requiredAmount ?? 0;

  const percentComplete = requiredAmount > 0
    ? Math.min(
        Math.round((gatheredAmount / requiredAmount) * 100),
        100,
      )
    : 0;

  const heroImageUrl = project?.image ? getMediaUrl(project.image) : null;

  const card = (
    <div
      className="relative aspect-square rounded-[28px] overflow-hidden"
      style={{
        background:
          "linear-gradient(145deg, #FFB88A 0%, #E65A2A 55%, #B83875 100%)",
      }}
    >
      {heroImageUrl && (
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center opacity-60 mix-blend-overlay"
          style={{ backgroundImage: `url(${heroImageUrl})` }}
        />
      )}
      {project && (
        <span className="absolute top-5 left-5 bg-white/95 backdrop-blur-sm text-primary text-[11px] font-semibold px-3.5 py-2 rounded-full">
          Ընթացիկ կոչ
        </span>
      )}

      {project && (
        <div className="absolute bottom-6 left-6 right-6 text-white">
          <div className="text-[22px] font-semibold leading-tight line-clamp-2">
            {project.name}
          </div>
          {requiredAmount > 0 && (
            <>
              <div className="mt-4 h-2 bg-white/25 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${percentComplete}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[13px]">
                <span>{formatCompact(gatheredAmount)} ֏ հավաքված</span>
                <span>{percentComplete}%</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );

  if (!project) return card;

  return (
    <Link
      className="block hover:opacity-95 transition-opacity"
      href={`/project/${project.slug}`}
    >
      {card}
    </Link>
  );
}
