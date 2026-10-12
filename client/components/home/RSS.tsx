import Link from "next/link";
import { buttonVariants } from "@heroui/styles";
import { Rss } from "lucide-react";

export default function RSS() {
  return (
    <Link
      className={buttonVariants({
        variant: "outline",
        className: "border-primary text-primary",
      })}
      href={`${process.env.NEXT_PUBLIC_BACKEND_URL}${process.env.NEXT_PUBLIC_RSS_URL}`}
      target="_blank"
    >
      <Rss className="w-4 h-4" />
      RSS
    </Link>
  );
}
