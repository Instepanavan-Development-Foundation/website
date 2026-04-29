import Link from "next/link";
import { Tooltip } from "@heroui/tooltip";
import { ArrowRightIcon, Heart } from "lucide-react";

import getData from "@/src/helpers/getData";
import { Avatar } from "@/components/Avatar";

export default async function TrustedByContributors() {
  const { data: trustedByContributors } = await getData({
    type: "contributors",
    fields: ["id", "fullName", "slug"],
    filters: { isTrustedBy: true },
    populate: { avatar: { fields: ["url"] } },
  });

  if (!trustedByContributors.length) {
    return null;
  }

  return (
    <section className="w-full my-12 md:my-16">
      <div className="text-center mb-8">
        <div className="text-[11px] font-medium tracking-[0.14em] text-primary uppercase mb-2">
          ՄԵԶ ՎՍՏԱՀՈՒՄ ԵՆ
        </div>
        <h2 className="text-[28px] md:text-[32px] font-semibold tracking-tighter2 text-ink">
          Աջակիցներ, որոնք հավատում են մեզ
        </h2>
      </div>

      <div className="relative">
        <div className="-mx-4 md:-mx-8 overflow-hidden">
          <div className="flex py-4 animate-[marquee_30s_linear_infinite] hover:[animation-play-state:paused]">
            {[...trustedByContributors, ...trustedByContributors].map((contributor, i) => (
              <Tooltip
                key={`${contributor.id}-${i}`}
                content={contributor.fullName}
                showArrow={true}
              >
                <Link
                  className="flex shrink-0 flex-col items-center px-4 transform hover:scale-105 transition-transform duration-200"
                  href={`/contributor/${contributor.slug}`}
                >
                  <Avatar
                    className="object-contain border-2 border-white shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
                    contributor={contributor}
                    height={88}
                  />
                </Link>
              </Tooltip>
            ))}
          </div>
        </div>
        <div className="mt-10 flex justify-center gap-3 flex-wrap">
          <Link
            className="inline-flex items-center gap-1 px-5 py-3 rounded-full text-sm font-medium text-ink bg-cream-100 hover:bg-cream-200 transition-colors"
            href="/contributors"
          >
            Դիտել աջակիցների ցանկը
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
          <Link
            className="inline-flex items-center gap-1.5 px-5 py-3 rounded-full text-sm font-medium text-white bg-primary hover:bg-primary-600 transition-colors"
            href={process.env.NEXT_PUBLIC_DONATE_URL ?? "/projects"}
          >
            <Heart className="fill-white" size={14} />
            Դառնալ աջակից
          </Link>
        </div>
      </div>
    </section>
  );
}
