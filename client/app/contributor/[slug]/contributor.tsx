"use client";

import { Image } from "@heroui/image";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { useEffect, useState } from "react";
import Link from "next/link";

import { Avatar } from "@/components/Avatar";
import getData from "@/src/helpers/getData";
import getMediaSrc from "@/src/helpers/getMediaUrl";
import NotFound from "@/components/NotFound";
import { IBlog } from "@/src/models/blog";
import { IContributor } from "@/src/models/contributor";
import { prettyDate } from "@/src/helpers/prettyDate";
import { IDonations } from "@/src/models/getData";
import { formatCurrency } from "@/components/home/ProjectCard";

interface ContributorProps {
  contributorId?: number;
  contributorSlug?: string;
  showCopyLink?: boolean;
}

export default function Contributor({
  contributorId,
  contributorSlug,
  showCopyLink = false,
}: ContributorProps) {
  const [contributor, setContributor] = useState<IContributor | null>(null);
  const [blogs, setBlogs] = useState<IBlog[]>([]);
  const [donations, setDonations] = useState<IDonations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    const fetchContributor = async () => {
      try {
        let filters = {};

        if (contributorId) {
          filters = { id: contributorId };
        } else if (contributorSlug) {
          filters = { slug: contributorSlug };
        } else {
          setError(true);
          setLoading(false);

          return;
        }

        const { data: contributors } = await getData({
          type: "contributors",
          populate: { avatar: { fields: ["url"] } },
          filters,
        });

        if (!contributors.length) {
          setError(true);
          setLoading(false);

          return;
        }

        const contributorData = contributors[0];

        setContributor(contributorData);

        // Fetch blogs for this contributor (simplified to avoid TypeScript issues)
        const { data: blogsData }: { data: IBlog[] } = await getData({
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
            },
          },
        });

        const { data: donationsData }: { data: IDonations[] } = await getData({
          type: "donations",
          fields: ["id", "amount", "currency", "createdAt"],
          populate: {
            project: {
              fields: ["id", "slug", "name"],
              populate: ["image"],
            },
          },
        });

        setDonations(donationsData);

        // Filter blogs to only include those with contributions from this contributor
        // TODO: filter on backend
        const filteredBlogs = blogsData.filter((blog) => {
          return blog.contribution?.some((contribution) => {
            if (contributorId) {
              return contribution.contributor.id === contributorId;
            } else {
              return contribution.contributor.slug === contributorSlug;
            }
          });
        });

        setBlogs(filteredBlogs);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchContributor();
  }, [contributorId, contributorSlug]);

  const handleCopyLink = async () => {
    if (!contributor) return;

    const url = `${window.location.origin}/contributor/${contributor.slug}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      // Handle copy failure silently
    }
  };

  if (loading) {
    return <div className="text-center py-8">Բեռնվում է...</div>;
  }

  if (error || !contributor) {
    return <NotFound />;
  }

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-16">
        <div className="relative">
          <Avatar contributor={contributor} height={200} width={200} />
          <div className="absolute inset-0 rounded-full ring-4 ring-primary ring-offset-4 ring-offset-background" />
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-bold mb-2">{contributor.fullName}</h1>
          <p className="text-default-500 max-w-2xl mb-4">{contributor.about}</p>
          {showCopyLink && (
            <Button
              className="mb-4"
              color="primary"
              variant="bordered"
              onPress={handleCopyLink}
            >
              {copySuccess ? "Պատճենվել է!" : "պատճենել հղումը"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div>
          <h2 className="text-3xl font-bold mb-8">Աջակցություն</h2>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            {blogs.map((blog) => (
              <Card
                key={blog.slug}
                className="hover:shadow-lg transition-shadow"
              >
                <CardBody>
                  <div className="flex flex-col md:flex-row gap-4">
                    <Link href={`/project/${blog.project.slug}`}>
                      <Image
                        alt={
                          blog.project.image.alternativeText || "project image"
                        }
                        className="rounded-lg object-cover"
                        height={80}
                        src={getMediaSrc(blog.project.image)}
                        width={80}
                      />
                    </Link>
                    <div>
                      <Link href={`/project/${blog.project.slug}`}>
                        Նախագիծ։ {blog.project.name}
                      </Link>
                      <p>
                        <Link
                          className="mb-1"
                          color="secondary"
                          href={`/blog/${blog.slug}`}
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
        {donations.length ? (
          <div>
            <h2 className="text-3xl font-bold mb-8">Նվիրաբերություն</h2>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              {donations.map((donation) => (
                <Card
                  key={donation.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardBody>
                    <div className="flex flex-col md:flex-row gap-4">
                      <Link href={`/project/${donation.project.slug}`}>
                        <Image
                          alt={
                            donation.project.image.alternativeText ||
                            "project image"
                          }
                          className="rounded-lg object-cover"
                          height={80}
                          src={getMediaSrc(donation.project.image)}
                          width={80}
                        />
                      </Link>
                      <div>
                        <Link href={`/project/${donation.project.slug}`}>
                          Նախագիծ։ {donation.project.name}
                        </Link>
                        <p>
                          <Link
                            className="mb-1"
                            color="secondary"
                            href={`/project/${donation.project.slug}`}
                          >
                            Նվիրաբերություն։ {formatCurrency(donation.amount)}
                          </Link>
                        </p>
                        <p>{prettyDate(donation.createdAt)}</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          ""
        )}
      </div>
    </section>
  );
}
