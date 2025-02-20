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

  const { data: contributors } = await getData({
    type: "contributors",
    populate: { avatar: { fields: ["url"] } },
    filters: {
      slug,
    },
  });

  if (!contributors.length) {
    return <NotFound />;
  }

  // TODO: check necessary fields
  const { data: blogs }: { data: IBlog[] } = await getData({
    type: "blogs",
    fields: ["id", "slug", "createdAt"],
    populate: {
      project: {
        fields: ["id", "slug", "name"],
        populate: ["image"],
      },
      contribution: {
        fields: ["id", "text"],
        populate: {
          contributor: {
            populate: ["avatar"],
          },
        },
        filters: {
          contributor: {
            slug,
          },
        },
      },
    },
    filters: {
      contribution: {
        contributor: {
          slug,
        },
      },
    },
  });

  const contributor = contributors[0];

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-16">
        <div className="relative">
          <Avatar contributor={contributor} width={200} height={200} />
          <div className="absolute inset-0 rounded-full ring-4 ring-primary ring-offset-4 ring-offset-background" />
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-bold mb-2">{contributor.fullName}</h1>
          <p className="text-default-500 max-w-2xl">{contributor.about}</p>
        </div>
      </div>

      {blogs.length ? (
        <div>
          <h2 className="text-3xl font-bold mb-8">Աջակցություն</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {blogs.map((blog) => (
              <Card
                key={blog.slug}
                className="hover:shadow-lg transition-shadow"
              >
                <CardBody>
                  <div className="flex flex-col md:flex-row gap-4">
                    <Link href={`/project/${blog.project.slug}`}>
                      <Image
                        src={getMediaSrc(blog.project.image)}
                        alt={
                          blog.project.image.alternativeText || "project image"
                        }
                        width={80}
                        height={80}
                        className="rounded-lg object-cover"
                      />
                    </Link>
                    <div>
                      <Link href={`/project/${blog.project.slug}`}>
                        Նախագիծ։ {blog.project.name}
                      </Link>
                      <p>
                        <Link
                          href={`/blog/${blog.slug}`}
                          className="mb-1"
                          color="secondary"
                        >
                          {blog.contribution[0].text}
                        </Link>
                      </p>
                      <p>{prettyDate(blog.createdAt)}</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
