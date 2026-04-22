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
        <p className="mt-3 text-[15px] text-ink-muted max-w-2xl mx-auto leading-relaxed">
          Մեր աջակիցները օգնում են մեզ ստեղծել իրական ազդեցություն։ Միացեք նրանց
          և դարձեք փոփոխության մի մասը։
        </p>
      </div>

      <div className="relative">
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6">
          {trustedByContributors.map((contributor) => (
            <Tooltip
              key={contributor.id}
              content={contributor.fullName}
              showArrow={true}
            >
              <Link
                className="flex flex-col items-center gap-2 transform hover:scale-105 transition-transform duration-200"
                href={`/contributor/${contributor.slug}`}
              >
                <div className="relative">
                  <Avatar
                    className="object-contain border-2 border-white shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
                    contributor={contributor}
                    height={88}
                  />
                </div>
              </Link>
            </Tooltip>
          ))}
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
            href="/project/instepanavan"
          >
            <Heart className="fill-white" size={14} />
            Դառնալ աջակից
          </Link>
        </div>
      </div>
    </section>
  );
}
