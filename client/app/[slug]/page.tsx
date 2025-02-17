import { Card, CardBody, CardFooter, CardHeader } from "@nextui-org/card";
import getData from "@/src/helpers/getData";
import { IStaticPage } from "@/src/models/stat-page";
import ModifiedMarkdown from "@/src/hok/modifiedMarkdown";
import { IParams } from "@/src/models/params";
import NotFound from "@/components/NotFound";
import { Button } from "@nextui-org/button";
import { Paperclip } from "lucide-react";
import { Link } from "@heroui/link";
import getMediaSrc from "@/src/helpers/getMediaUrl";

// TODO: Name should be generated like this "Project Name - website title" on every page
export async function generateMetadata({ params }: IParams) {
  const { slug } = await params;
  const { data }: { data: IStaticPage[] } = await getData({
    type: "static-pages",
    filters: { slug },
  });

  const [staticPage] = data;
  if (!staticPage) {
    return null
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
      <h1 className="text-5xl font-bold text-center mb-10">{staticPage.title}</h1>
      <Card>
        <CardBody>
          <div className="prose">
            <ModifiedMarkdown>{staticPage.description}</ModifiedMarkdown>
          </div>
        </CardBody>
        <CardFooter className="flex flex-row flex-wrap gap-2">
          {staticPage.attachments?.map((attachment) => (
            <Link href={getMediaSrc(attachment)} target="_blank" key={attachment.url}>
              <Button className="btn btn-success">
                <Paperclip className="w-4 h-4" />
                {attachment.name}
              </Button>
            </Link>
          ))}
        </CardFooter>
      </Card>
    </div>
  );
}
