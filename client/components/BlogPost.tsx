'use client'

import { Card, CardBody } from "@nextui-org/card";
import { Chip } from "@nextui-org/chip";
import { Paperclip, Bookmark } from "lucide-react";
import { useState } from "react";
import { Image } from "@nextui-org/image";

import { ContributorsList } from "./ContributorsList";
import { IBlog } from "@/src/models/blog";
import getMediaUrl from "@/src/helpers/getMediaUrl";
import { Link } from "@nextui-org/link";

// Lightbox
import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import NextJsImage from "./NextJsImage";


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
  link,
}: IBlog) {

  const [open, setOpen] = useState(false);

  const imageSlides = images.map((image) => ({
    src: getMediaUrl(image),
    width: image.width,
    height: image.height,
  }));

  return (
    // TODO fix styles for isFeatured and mobile version
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
            <>

              <Lightbox
                open={open}
                close={() => setOpen(false)}
                slides={imageSlides}
                render={{ slide: NextJsImage, thumbnail: NextJsImage }}
                plugins={[Thumbnails]}
              />
              <Image
                onClick={() => setOpen(true)}
                alt={content}
                className="w-full object-cover h-[200px] z-10 cursor-zoom-in"
                src={getMediaUrl(images[0])}
                width="100%"
                radius="none"
              />
              <div className="relative -top-7 z-30 bg-black bg-opacity-50 text-white p-2 text-xs text-right h-7">
                ևս {images.length} նկար
              </div>
            </>
          ) : (
            <div className="w-full h-[200px] bg-gradient-to-br from-primary to-secondary z-10" />
          )}

          <div className="p-5">
            <p className="text-xs text-gray-500">{createdAt}</p>
            <Link href={link ? `/blog/${slug}` : ''}>
              <p className="text-default-500 mb-4">
                {content?.length > 150 ? `${content.slice(0, 150)}...` : content}
              </p>
            </Link>
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
            <div className="flex -space-x-2 mb-4">
              <Link href={`/project/${project.slug}`} color="secondary">
                {project.name}
              </Link>
            </div>

            {/* Contributors */}
            <div className="flex -space-x-2 mb-4">
              <ContributorsList contributors={contribution} />
            </div>

            {/* Attachments */}
            {attachments && (
              <div className="mt-4">
                {attachments.map((attachment, idx) => (
                  <a
                    key={idx}
                    href={getMediaUrl(attachment)}
                    className="flex items-center text-blue-500 hover:underline"
                    download
                  >
                    <Paperclip className="w-4 h-4 mr-2" />
                    {attachment.name}
                  </a>
                ))}
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
