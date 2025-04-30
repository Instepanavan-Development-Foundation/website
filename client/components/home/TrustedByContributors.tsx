import Link from "next/link";
import { button as buttonStyles } from "@nextui-org/theme";

import { Avatar } from "@/components/Avatar";
import { Tooltip } from "@heroui/tooltip";
import getData from "@/src/helpers/getData";
import { ArrowRightIcon, Heart } from "lucide-react";
import { Card } from "@nextui-org/card";

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
    <div className="w-full container my-16">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-3">Մեզ վստահում են</h2>
        <p className="text-default-600 max-w-2xl mx-auto">
          Մեր աջակիցները հավատում են մեր առաքելությանը և օգնում են մեզ ստեղծել իրական ազդեցություն: 
          Միացեք նրանց և դարձեք փոփոխության մի մասը:
        </p>
      </div>

      {/* Contributor avatars with animation */}
      <div className="relative">
          <div className="grid grid-cols-4 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {trustedByContributors.map((contributor, index) => (
              <Tooltip
                content={contributor.fullName}
                showArrow={true}
                key={contributor.id}
              >
                <Link
                  href={`/contributor/${contributor.slug}`}
                  className="flex flex-col items-center gap-2 transform hover:scale-110 transition-transform duration-300"
                >
                  <div className="relative">
                    <Avatar
                      contributor={contributor}
                      height={100}
                      className="object-contain border-2 border-white shadow-md"
                    />
                  </div>
                </Link>
              </Tooltip>
            ))}
          </div>
          
          {/* Join message */}
          <div className="mt-8 text-center">
            
            <div className="flex justify-center gap-4">
              <Link
                href="/contributors"
                className={buttonStyles({
                  variant: "flat",
                  radius: "full",
                  size: "md",
                })}
              >
                Դիտել աջակիցների ցանկը
                <ArrowRightIcon className="w-4 h-4 ml-1" />
              </Link>
              <Link
                href="/donate"
                className={buttonStyles({
                  variant: "solid",
                  color: "danger",
                  radius: "full",
                  size: "md",
                })}
              >
                <Heart className="w-4 h-4 mr-1" /> Դառնալ աջակից
              </Link>
            </div>
          </div>      </div>
    </div>
  );
}
