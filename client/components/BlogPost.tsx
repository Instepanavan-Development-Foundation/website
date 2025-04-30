"use client";

import { Card, CardBody } from "@nextui-org/card";
import { Chip } from "@nextui-org/chip";
import { Paperclip, Bookmark } from "lucide-react";
import { useState } from "react";
import { Image } from "@heroui/image";
import Link from "next/link";
import Markdown from "react-markdown";
import remarkGfm from 'remark-gfm'

import { ContributorsList } from "./ContributorsList";
import { IBlog } from "@/src/models/blog";
import getMediaUrl from "@/src/helpers/getMediaUrl";

// Lightbox
import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import NextJsImage from "./NextJsImage";
import { prettyDate } from "@/src/helpers/prettyDate";

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
}: IBlog) {
  const numberOfImagesShown = 1;
  const [open, setOpen] = useState(false);

  const imageSlides = (images || []).map((image) => ({
    src: getMediaUrl(image),
    width: image.width,
    height: image.height,
  }));

  const youtubeLink = content.match(/https?:\/\/(www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/);
  const gradient = "bg-gradient-to-br from-primary to-secondary";
  return (
    <div className="relative">
      {isFeatured && (
        <div className="absolute -top-3 -right-3 z-30 bg-primary rounded-full w-12 h-12 flex items-center justify-center">
          <Bookmark className="w-6 h-6 text-white" />
        </div>
      )}
      <Card className="group">
        <CardBody className="p-0">
          {/* TODO images like in fb, 3 images on front */}
          {images?.length ? (
            <button onClick={() => setOpen(true)} className="cursor-zoom-in">
              <Lightbox
                open={open}
                close={() => setOpen(false)}
                slides={imageSlides}
                render={{ slide: NextJsImage, thumbnail: NextJsImage as any }} // TODO: fix this some day
                plugins={[Thumbnails]}
              />
              <Image
                alt={content}
                className={`w-full object-contain h-[200px] z-10 ${gradient}`}
                src={getMediaUrl(images[0])}
                width="100"
                radius="none"
              />
              {/* Count of images in the blog post */}
              {images.length > numberOfImagesShown && (
                <div className="relative">
                  <div className="absolute bottom-0 right-0 z-30 bg-black bg-opacity-50 text-white p-2 text-xs text-right h-7">
                    ևս {images.length - numberOfImagesShown} նկար
                  </div>
                </div>
              )}
            </button>
          ) : (
            <div className="w-full h-[200px] bg-gradient-to-br from-primary to-secondary z-10" />
          )}

          <div className="p-5">
            <p className="text-xs text-gray-500">{prettyDate(createdAt)}</p>
            {isLink ? (
              <Link href={`/blog/${slug}`}>
                <p className="text-default-500 mb-4 line-clamp-[10]">
                  <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
                  {/* TODO: why link is not working in markdown? */}
                </p>
              </Link>
            ) : (
              <p className="text-default-500 mb-4">
                <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
              </p>
            )}
            {/* Tags */}
            <div className="flex gap-2 flex-wrap mb-4">
              {tag &&
                tag.map(({ name }, tagIndex) => (
                  <Chip key={tagIndex} size="sm" variant="flat">
                    {name}
                  </Chip>
                ))}
            </div>

            {/* Project */}
            {project && (
              <div className="flex -space-x-2 mb-4">
                <Link
                  href={`/project/${project.slug}`}
                  color="secondary"
                  className="line-clamp-2"
                >
                  {project.name}
                </Link>
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
                    href={getMediaUrl(attachment)}
                    className="flex items-center text-blue-500 hover:underline"
                    download
                    target="_blank"
                  >
                    <Paperclip className="w-4 h-4 mr-2" />
                    {attachment.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
