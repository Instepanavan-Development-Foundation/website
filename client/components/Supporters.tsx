"use client";

import { Avatar } from "@/components/Avatar";
import { IContribution } from "@/src/models/blog";
import { Ellipsis, EllipsisVertical, Star } from "lucide-react";
import { Link } from "@nextui-org/link";
import { button as buttonStyles } from "@nextui-org/theme";
import { useState } from "react";
import { Button } from "@nextui-org/button";

const LIMIT = Number(process.env.NEXT_PUBLIC_QUERY_LIMIT || 10);

export default function Supporters({
  contributors,
}: {
  contributors: IContribution[];
}) {
  const [limit, setLimit] = useState(LIMIT);
  const slicedContributors = contributors.slice(0, limit);

  return (
    <div className="container mb-16" id="contributors">
      <h2 className="text-3xl font-bold mb-8">Աջակիցներ</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {slicedContributors.map((contributor, index) => (
          <Link
            href={`/contributor/${contributor.contributor.slug}`}
            key={index}
            className="flex items-center p-3 bg-default-50 rounded-xl hover:bg-default-100 transition-colors relative"
          >
            {contributor.isFeatured && (
              <div className="absolute -top-2 -right-2 bg-warning-400 text-white rounded-full p-1">
                <Star className="w-4 h-4" />
              </div>
            )}
            <div className="relative min-w-[50px]">
              <Avatar
                contributor={contributor.contributor}
                width={50}
                height={50}
              />
              <div className="absolute inset-0 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-background" />
            </div>
            <div className="">
              <p className="p-3">
                {contributor.contributor.fullName}՝ {contributor.text}
              </p>
            </div>
          </Link>
        ))}
      </div>
      <div className="col-span-full flex justify-center mt-8">
        {contributors.length > limit && (
          <Button
            className={buttonStyles({
              variant: "flat",
              radius: "full",
              size: "lg",
            })}
            onClick={() => setLimit((prev) => prev + LIMIT)}
          >
            Բեռնել ավել
            <EllipsisVertical className="ml-2 w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
