"use client";

import { Card, Chip } from "@heroui/react";
import { Paperclip, Bookmark, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";

import { Image } from "@/components/ui/Image";
import { IBlog } from "@/src/models/blog";
import getMediaUrl from "@/src/helpers/getMediaUrl";
import { prettyDate } from "@/src/helpers/prettyDate";
import ModifiedMarkdown from "@/src/hok/modifiedMarkdown";

// Lightbox
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

import NextJsImage from "./NextJsImage";
import { BlogImageGrid } from "./BlogImageGrid";
import { ContributorsList } from "./ContributorsList";

function extractFirstUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s)>\]"]+/);

  return match?.[0] ?? null;
}

export function BlogPost({
  content,
  images,
  tag,
  contribution,
  attachments,
  isFeatured,
  createdAt,
  project,
  slug,
  isLink = true,
  showDonateButton = false,
}: IBlog) {
  // Index of the image open in the lightbox, -1 when closed.
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [linkOgImage, setLinkOgImage] = useState<string | null>(null);

  const hasImages = images?.length > 0;

  useEffect(() => {
    if (hasImages) return;

    const url = extractFirstUrl(content);

    if (!url) return;

    fetch(`/og-image?url=${encodeURIComponent(url)}`)
      .then((r) => r.json())
      .then(({ imageUrl }) => {
        if (imageUrl)
          setLinkOgImage(`/proxy-image?url=${encodeURIComponent(imageUrl)}`);
      })
      .catch(() => {});
  }, [content, hasImages]);

  const imageSlides = (images || []).map((image) => ({
    src: getMediaUrl(image),
    width: image.width,
    height: image.height,
  }));

  // Plain-text excerpt of the post, used as fallback alt text for its images.
  const imageAlt = content
    .replace(/[#*_>`[\]()!]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);

  const youtubeLink = content.match(
    /https?:\/\/(www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
  );
  const gradient = "bg-gradient-to-br from-[#FFB088] to-[#E65A2A]";

  return (
    <div className="relative">
      {isFeatured && (
        <div className="absolute -top-3 -right-3 z-30 bg-primary rounded-full w-12 h-12 flex items-center justify-center">
          <Bookmark className="w-6 h-6 text-white" />
        </div>
      )}
      <Card className="group rounded-[20px] border border-cream-200 shadow-none hover:shadow-[0_12px_32px_rgba(230,90,42,0.06)] transition-shadow">
        <Card.Content className="p-0">
          {hasImages ? (
            <>
              <Lightbox
                close={() => setLightboxIndex(-1)}
                index={Math.max(lightboxIndex, 0)}
                open={lightboxIndex >= 0}
                plugins={[Thumbnails]}
                render={{ slide: NextJsImage, thumbnail: NextJsImage as any }} // TODO: fix this some day
                slides={imageSlides}
              />
              <BlogImageGrid
                alt={imageAlt}
                className="h-[200px] rounded-t-[19px] rounded-b-xl"
                images={images}
                singleImageClassName={gradient}
                onOpen={setLightboxIndex}
              />
            </>
          ) : linkOgImage ? (
            <Image
              alt={content}
              className="w-full object-cover h-50 z-10"
              radius="none"
              src={linkOgImage}
              width="100"
            />
          ) : (
            <div className="w-full h-[200px] bg-gradient-to-br from-primary-300 to-primary-500 z-10" />
          )}

          <div className="p-5">
            <p className="text-xs text-ink-meta">{prettyDate(createdAt)}</p>
            {isLink ? (
              <Link href={`/blog/${slug}`}>
                <div className="text-default-500 mb-4 line-clamp-[10]">
                  <ModifiedMarkdown disableLinks={true}>
                    {content}
                  </ModifiedMarkdown>
                </div>
              </Link>
            ) : (
              <div className="text-default-500 mb-4">
                <ModifiedMarkdown>{content}</ModifiedMarkdown>
              </div>
            )}
            {/* Tags */}
            <div className="flex gap-2 flex-wrap mb-4">
              {tag &&
                tag.map(({ name }, tagIndex) => (
                  <Chip key={tagIndex} size="sm" variant="soft">
                    {name}
                  </Chip>
                ))}
            </div>

            {/* Project */}
            {(project || !isLink) && (
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                {project && (
                  <Link
                    className="line-clamp-2"
                    color="secondary"
                    href={`/project/${project.slug}`}
                  >
                    {project.name}
                  </Link>
                )}
                {showDonateButton ? (
                  <a
                    className="inline-flex items-center gap-1.5 border-2 border-primary text-primary px-4 py-1.5 rounded-full text-[13px] font-medium hover:bg-primary hover:text-white transition-colors"
                    href={`/donate/${project.slug}`}
                  >
                    <Heart className="w-3.5 h-3.5 fill-current" />
                    Աջակցել նախագծին
                  </a>
                ) : (
                  !isLink && (
                    <a
                      className="inline-flex items-center gap-1.5 border-2 border-primary text-primary px-4 py-1.5 rounded-full text-[13px] font-medium hover:bg-primary hover:text-white transition-colors"
                      href={process.env.NEXT_PUBLIC_DONATE_URL}
                    >
                      <Heart className="w-3.5 h-3.5 fill-current" />
                      Աջակցել մեզ
                    </a>
                  )
                )}
              </div>
            )}

            {/* Contributors */}
            <div className="flex -space-x-2 mb-4">
              <ContributorsList contributions={contribution} />
            </div>

            {/* Attachments */}
            {attachments && (
              <div className="mt-4">
                {attachments.map((attachment, idx) => (
                  <Link
                    key={idx}
                    download
                    className="flex items-center text-primary hover:underline"
                    href={getMediaUrl(attachment)}
                    target="_blank"
                  >
                    <Paperclip className="w-4 h-4 mr-2" />
                    {attachment.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
