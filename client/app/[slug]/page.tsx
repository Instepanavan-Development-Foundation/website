import { Paperclip } from "lucide-react";
import Link from "next/link";

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

  if (!staticPage) return null;

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

  if (!staticPage) return <NotFound />;

  return (
    <div className="max-w-3xl mx-auto py-10 md:py-14">
      <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-ink leading-[1.05] mb-6">
        {staticPage.title}
      </h1>

      <div className="bg-cream-100 rounded-[28px] p-8 md:p-10">
        <div className="prose prose-lg max-w-none text-ink-body [&_h2]:text-ink [&_h2]:font-semibold [&_h3]:text-ink [&_a]:text-primary [&_a]:no-underline [&_a:hover]:underline">
          <ModifiedMarkdown>{staticPage.description}</ModifiedMarkdown>
        </div>

        {staticPage.attachments && staticPage.attachments.length > 0 && (
          <div className="mt-8 pt-6 border-t border-cream-200 flex flex-wrap gap-3">
            {staticPage.attachments.map((attachment) => (
              <Link
                key={attachment.id || attachment.documentId}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-ink bg-white border border-cream-200 hover:border-primary hover:text-primary transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                href={getMediaSrc(attachment)}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Paperclip className="w-4 h-4 shrink-0" />
                {attachment.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
