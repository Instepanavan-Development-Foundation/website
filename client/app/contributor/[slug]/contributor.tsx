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
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const fetchContributor = async () => {
      try {
        let filters = {};
        let isUserDocumentId = false;

        if (contributorId) {
          filters = { id: contributorId };
        } else if (contributorSlug) {
          // Check if slug looks like a documentId (long alphanumeric string)
          if (
            contributorSlug.length > 20 &&
            /^[a-z0-9]+$/.test(contributorSlug)
          ) {
            isUserDocumentId = true;
          } else {
            filters = { slug: contributorSlug };
          }
        } else {
          setError(true);
          setLoading(false);

          return;
        }

        // Try to fetch contributor profile first (unless it's definitely a user documentId)
        if (!isUserDocumentId) {
          const { data: contributors } = await getData({
            type: "contributors",
            populate: { avatar: { fields: ["url"] } },
            filters,
          });

          if (contributors.length > 0) {
            const contributorData = contributors[0];

            setContributor(contributorData);
          } else {
            // No contributor found, treat as user documentId
            isUserDocumentId = true;
          }
        }

        // If it's a user documentId, fetch user data via custom endpoint
        if (isUserDocumentId && contributorSlug) {
          try {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/contributor/by-user/${contributorSlug}`,
            );

            if (response.ok) {
              const userData = await response.json();

              setUserData(userData);
            } else {
              setError(true);
              setLoading(false);

              return;
            }
          } catch (e) {
            setError(true);
            setLoading(false);

            return;
          }
        }

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

        // Fetch donations based on whether we have a contributor or user
        let donationsData: IDonations[] = [];

        if (contributor) {
          // Fetch donations linked to contributor
          const { data } = await getData({
            type: "donations",
            fields: ["id", "amount", "currency", "createdAt"],
            populate: {
              project: {
                fields: ["id", "slug", "name"],
                populate: ["image"],
              },
              contributor: {
                fields: ["id"],
              },
            },
          });

          // Filter donations for this contributor (TODO: do on backend)
          donationsData = data.filter((d: any) =>
            d.contributor?.some((c: any) => c.id === contributor.id),
          );
        } else if (userData && contributorSlug) {
          // For users without contributor profile, fetch their project-payments by userDocumentId
          try {
            console.log(
              "Fetching project-payments for user documentId:",
              contributorSlug,
            );
            const url =
              `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/project-payments?` +
              `populate[project][fields][0]=name&` +
              `populate[project][fields][1]=slug&` +
              `populate[project][populate][image][fields][0]=url&` +
              `populate[payment_method][fields][0]=userDocumentId&` +
              `filters[payment_method][userDocumentId][$eq]=${contributorSlug}&` +
              `fields[0]=amount&` +
              `fields[1]=currency&` +
              `fields[2]=type&` +
              `fields[3]=createdAt`;

            console.log("Fetching URL:", url);
            const response = await fetch(url);

            console.log("Response status:", response.status);

            if (response.ok) {
              const result = await response.json();

              console.log("Project-payments result:", result);
              // Map project-payments to donations format
              donationsData = result.data.map((pp: any) => ({
                id: pp.id,
                amount: pp.amount,
                currency: pp.currency,
                createdAt: pp.createdAt,
                project: pp.project,
              }));
              console.log("Mapped donations:", donationsData);
            } else {
              console.error(
                "Failed to fetch project-payments, status:",
                response.status,
              );
            }
          } catch (e) {
            console.error("Failed to fetch project-payments:", e);
          }
        }

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

  if (error || (!contributor && !userData)) {
    return <NotFound />;
  }

  const displayName =
    contributor?.fullName ||
    (userData as any)?.fullName ||
    userData?.username ||
    "Օգտատեր";
  const displayAbout = contributor?.about || "";

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-16">
        <div className="relative">
          {contributor ? (
            <>
              <Avatar contributor={contributor} height={200} width={200} />
              <div className="absolute inset-0 rounded-full ring-4 ring-primary ring-offset-4 ring-offset-background" />
            </>
          ) : (
            <div className="w-[200px] h-[200px] rounded-full bg-primary-100 flex items-center justify-center text-6xl font-bold text-primary">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-bold mb-2">{displayName}</h1>
          {displayAbout && (
            <p className="text-default-500 max-w-2xl mb-4">{displayAbout}</p>
          )}
          {showCopyLink && contributor && (
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
        {blogs.length > 0 && (
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
                            blog.project.image.alternativeText ||
                            "project image"
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
        )}
        {donations.length > 0 && (
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
                            {formatCurrency(donation.amount)} ընդհանուր
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
        )}
      </div>
    </section>
  );
}
