import { Card, CardBody } from "@nextui-org/card";
import { Image } from "@nextui-org/image";
import { Chip } from "@nextui-org/chip";
import { Paperclip, Bookmark } from "lucide-react";

import { ContributorsList } from "./ContributorsList";
import { IBlog } from "@/src/models/blog";
import getMediaUrl from "@/src/helpers/getMediaUrl";

export function BlogPost({
  content,
  images,
  tag,
  contribution,
  attachments,
  isFeatured,
  createdAt,
}: IBlog) {
  return (
    // TODO fix styles for isFeatured and mobile version
    <div className="relative"> 
      {isFeatured && (
        <div className="absolute -top-3 -right-3 z-30 bg-primary rounded-full w-12 h-12 flex items-center justify-center">
          <Bookmark className="w-6 h-6 text-white" />
        </div>
      )}
      <Card isPressable className="group">
        <CardBody className="p-0">
          {/* TODO images like in fb, 3 images on front */}
          {images?.length ? (
            <Image
              alt={content}
              className="w-full object-cover h-[200px] z-10"
              src={getMediaUrl(images[0])}
              width="100%"
              radius="none"
            />
          ) : (
            <div className="w-full h-[200px] bg-gradient-to-br from-primary to-secondary z-10" />
          )}
          <div className="p-5">
            <p className="text-xs text-gray-500">{createdAt}</p>
            <p className="text-default-500 mb-4">
              {content?.length > 150 ? `${content.slice(0, 150)}...` : content}
            </p>

            {/* Tags */}
            <div className="flex gap-2 flex-wrap mb-4">
              {tag &&
                tag.map(({ name }, tagIndex) => (
                  <Chip key={tagIndex} size="sm" variant="flat">
                    {name}
                  </Chip>
                ))}
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
