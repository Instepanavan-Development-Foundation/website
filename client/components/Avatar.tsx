import crypto from "crypto";

import { Image } from "@/components/ui/Image";
import getThumbUrl from "@/src/helpers/getThumbUrl";
import { IContributor } from "@/src/models/contributor";

function getGravatarUrl(email: string, size = 80) {
  const trimmedEmail = email.trim().toLowerCase();
  const hash = crypto.createHash("sha256").update(trimmedEmail).digest("hex");

  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}

export function Avatar({
  contributor,
  width,
  height,
  className,
}: {
  contributor: IContributor;
  width?: number;
  height: number;
  className?: string;
}) {
  if (!contributor) {
    return <></>;
  }

  const avatarUrl = contributor.avatar?.url
    ? getThumbUrl(contributor.avatar, Math.max(width ?? 0, height * 2))
    : getGravatarUrl(contributor.email);

  return (
    <>
      <Image
        alt={"contributor.name"}
        className={
          className ||
          "rounded-full border-2 border-gray-200 object-contain bg-white"
        }
        height={height}
        src={avatarUrl}
        width={width}
      />
    </>
  );
}
