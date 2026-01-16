import { Card, CardBody, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Paperclip } from "lucide-react";

import getData from "@/src/helpers/getData";
import { IStaticPage } from "@/src/models/stat-page";
import ModifiedMarkdown from "@/src/hok/modifiedMarkdown";
import { IParams } from "@/src/models/params";
import NotFound from "@/components/NotFound";
import getMediaSrc from "@/src/helpers/getMediaUrl";

export async function generateMetadata({ params }: IParams) {
  const { slug } = await params;
  const { data }: { data: IStaticPage[] } = await getData({
    type: "static-pages",
    filters: { slug },
  });

  const [staticPage] = data;

  if (!staticPage) {
    return null;
  }

  return {
    title: staticPage.title,
    description: staticPage.description,
  };
}

export default async function StaticPage({ params }: IParams) {
  const { slug } = await params;

  const { data }: { data: IStaticPage[] } = await getData({
    type: "static-pages",
    filters: { slug },
    populate: {
      attachments: { fields: ["url", "name"] },
    },
  });

  const [staticPage] = data;

  if (!staticPage) {
    NotFound();
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-5xl font-bold text-center mb-10">
        {staticPage.title}
      </h1>
      <Card>
        <CardBody>
          <div className="prose max-w-none">
            <ModifiedMarkdown>{staticPage.description}</ModifiedMarkdown>
          </div>
        </CardBody>
        <CardFooter className="flex flex-row flex-wrap gap-2">
          {staticPage.attachments?.map((attachment) => (
            <Button
              as="a"
              className="btn btn-success"
              href={getMediaSrc(attachment)}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Paperclip className="w-4 h-4" />
              {attachment.name}
            </Button>
          ))}
        </CardFooter>
      </Card>
    </div>
  );
}
