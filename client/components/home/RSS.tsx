import Link from "next/link";
import { Button } from "@nextui-org/button";
import { Rss } from "lucide-react";

export default function RSS() {
  return (
    <Link
      href={`${process.env.NEXT_PUBLIC_BACKEND_URL}${process.env.NEXT_PUBLIC_RSS_URL}`}
      target="_blank"
    >
      <Button variant="bordered" color="warning">
        <Rss className="w-4 h-4" />
        RSS
      </Button>
    </Link>
  );
}
