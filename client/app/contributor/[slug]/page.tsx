import { Metadata } from "next";

import Contributor from "./contributor";

import getData from "@/src/helpers/getData";
import getMediaSrc from "@/src/helpers/getMediaUrl";
import { IParams } from "@/src/models/params";

export async function generateMetadata({ params }: IParams): Promise<Metadata> {
  const { slug } = await params;

  const { data: contributors } = await getData({
    type: "contributors",
    fields: ["fullName", "about"],
    populate: { avatar: { fields: ["url"] } },
    filters: {
      slug,
    },
  });

  if (!contributors.length) {
    return {
      title: "",
    };
  }

  const contributor = contributors[0];

  return {
    title: contributor.fullName,
    description: contributor.about,
    openGraph: {
      type: "website",
      images: { url: getMediaSrc(contributor.avatar) },
    },
  };
}

export default async function ContributorPage({ params }: IParams) {
  const { slug } = await params;

  return <Contributor contributorSlug={slug} showCopyLink={true} />;
}
