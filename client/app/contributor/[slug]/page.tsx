import { Image } from "@heroui/image";
import { Card, CardBody } from "@nextui-org/card";

import { Avatar } from "@/components/Avatar";
import getData from "@/src/helpers/getData";
import getMediaSrc from "@/src/helpers/getMediaUrl";
import { IParams } from "@/src/models/params";
import NotFound from "@/components/NotFound";
import { IBlog } from "@/src/models/blog";
import { prettyDate } from "@/src/helpers/prettyDate";
import Link from "next/link";
import { Metadata } from "next";
import Contributor from "./contributor";

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
  return (<Contributor contributorSlug={slug} showCopyLink={true} />);
}
