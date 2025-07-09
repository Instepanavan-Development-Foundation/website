import { AnchorHTMLAttributes } from "react";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

interface IMarkdownChildrenProps {
  children: string | null | undefined;
}
type IModifiedAnchor = React.FC<AnchorHTMLAttributes<HTMLAnchorElement>>;

export default function ModifiedMarkdown({ children }: IMarkdownChildrenProps) {
  const LinkRenderer: IModifiedAnchor = ({ href, children }) => {
    const target = href?.startsWith("/") ? "" : "_blank";

    return (
      <a href={href} rel="noopener noreferrer" target={target}>
        {children}
      </a>
    );
  };

  return (
    <Markdown
      components={{
        a: LinkRenderer,
      }}
      rehypePlugins={[rehypeRaw]}
      remarkPlugins={[remarkGfm]}
    >
      {children}
    </Markdown>
  );
}
