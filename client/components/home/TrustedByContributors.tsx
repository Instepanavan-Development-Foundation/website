import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { Tooltip } from "@heroui/tooltip";
import getData from "@/src/helpers/getData";

export default async function TrustedByContributors() {
  const { data: trustedByContributors } = await getData({
    type: "contributors",
    fields: ["id", "fullName"],
    filters: { isTrustedBy: true },
    populate: { avatar: { fields: ["url"] } },
  });

  if (!trustedByContributors.length) {
    return null;
  }

  return (
    <div className="w-full container my-8">
      <h2 className="text-3xl font-bold mb-6">Մեզ վստահում են</h2>

      <div className="grid grid-cols-4 md:grid-cols-4 lg:grid-cols-6 gap-8">
        {trustedByContributors.map((contributor) => (
          <Tooltip
            content={contributor.fullName}
            showArrow={true}
            key={contributor.id}
          >
            <Link
              href={`/contributor/${contributor.slug}`}
              className="flex flex-col items-center gap-2"
            >
              <Avatar
                contributor={contributor}
                height={100}
                className="object-contain"
              />
            </Link>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
