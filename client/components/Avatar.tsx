import crypto from "crypto";
import { Image } from "@heroui/image";

import getMediaUrl from "@/src/helpers/getMediaUrl";
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
    ? getMediaUrl(contributor.avatar)
    : getGravatarUrl(contributor.email);

  return (
    <>
      <Image
        src={avatarUrl}
        alt={"contributor.name"}
        width={width}
        height={height}
        className={
          className || "rounded-full  border-2 border-background object-contain"
        }
      />
    </>
  );
}
