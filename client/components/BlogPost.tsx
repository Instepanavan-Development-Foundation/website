import { Card, CardBody } from "@nextui-org/card";
import { Image } from "@nextui-org/image";
import { Chip } from "@nextui-org/chip";
import { Paperclip, Bookmark } from "lucide-react";

import { ContributorsList } from "./ContributorsList";

interface Contributor {
  name: string;
  avatar: string;
}

interface Attachment {
  name: string;
  url: string;
}

interface BlogPostProps {
  description: string;
  img?: string;
  tags: string[];
  contributors: Contributor[];
  attachments?: Attachment[];
  featured?: boolean;
}

export function BlogPost({ description, img, tags, contributors, attachments, featured, date }: BlogPostProps) {
  return (
    <div className="relative">
      {featured && (
        <div className="absolute -top-3 -right-3 z-30 bg-primary rounded-full w-12 h-12 flex items-center justify-center">
          <Bookmark className="w-6 h-6 text-white" />
        </div>
      )}
      <Card isPressable className="group">
        <CardBody className="p-0">
          {img ? (
            <Image
              alt={description}
              className="w-full object-cover h-[200px] z-10"
              src={img}
              width="100%"
              radius="none"
            />
          ) : (
            <div className="w-full h-[200px] bg-gradient-to-br from-primary to-secondary z-10" />
          )}
          <div className="p-5">
            <p className="text-xs text-gray-500">{date}</p>
            <p className="text-default-500 mb-4">
              {description.length > 150
                ? `${description.slice(0, 150)}...`
                : description}
            </p>

            {/* Tags */}
            <div className="flex gap-2 flex-wrap mb-4">
              {tags.map((tag, tagIndex) => (
                <Chip key={tagIndex} size="sm" variant="flat">
                  {tag}
                </Chip>
              ))}
            </div>

            {/* Contributors */}
            <div className="flex -space-x-2 mb-4">
              <ContributorsList contributors={contributors} />
            </div>

            {/* Attachments */}
            {attachments?.length > 0 && (
              <div className="mt-4">
                {attachments.map((attachment, idx) => (
                  <a
                    key={idx}
                    href={attachment.url}
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