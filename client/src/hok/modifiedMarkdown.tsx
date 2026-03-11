import { AnchorHTMLAttributes, ImgHTMLAttributes } from "react";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

interface IMarkdownChildrenProps {
  children: string | null | undefined;
  disableLinks?: boolean;
}
type IModifiedAnchor = React.FC<AnchorHTMLAttributes<HTMLAnchorElement>>;
type IModifiedImage = React.FC<ImgHTMLAttributes<HTMLImageElement>>;

export default function ModifiedMarkdown({
  children,
  disableLinks = false,
}: IMarkdownChildrenProps) {
  const LinkRenderer: IModifiedAnchor = ({ href, children }) => {
    const target = href?.startsWith("/") ? "" : "_blank";

    // If disableLinks is true, render as plain text with link styling
    if (disableLinks) {
      return <span className="text-blue-500 underline">{children}</span>;
    }

    return (
      <a href={href} rel="noopener noreferrer" target={target}>
        {children}
      </a>
    );
  };

  const ImageRenderer: IModifiedImage = ({ src, alt }) => {
    return (
      <span className="flex justify-center my-4 block">
        <img alt={alt} className="max-w-full h-auto" src={src} />
      </span>
    );
  };

  return (
    <Markdown
      components={{
        a: LinkRenderer,
        img: ImageRenderer,
      }}
      rehypePlugins={[rehypeRaw]}
      remarkPlugins={[remarkGfm]}
    >
      {children}
    </Markdown>
  );
}
