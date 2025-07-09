import Link from "next/link";
import { Tooltip } from "@heroui/tooltip";

import { Avatar } from "@/components/Avatar";
import getData from "@/src/helpers/getData";

export default async function Contributors() {
  const { data: trustedByContributors } = await getData({
    type: "contributors",
    fields: ["id", "fullName", "slug", "email"],
    filters: {},
    populate: { avatar: { fields: ["url"] } },
    limit: 10000,
  });

  if (!trustedByContributors.length) {
    return null;
  }

  return (
    <div className="w-full container my-8">
      <h1 className="mb-8 text-5xl">Աջակիցներ</h1>

      <div className="grid grid-cols-4 md:grid-cols-4 lg:grid-cols-6 gap-8">
        {trustedByContributors.map((contributor) => (
          <Tooltip
            key={contributor.id}
            content={contributor.fullName}
            showArrow={true}
          >
            <Link
              className="flex flex-col items-center gap-2"
              href={`/contributor/${contributor.slug}`}
            >
              <Avatar
                className="object-contain"
                contributor={contributor}
                height={100}
              />
            </Link>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
