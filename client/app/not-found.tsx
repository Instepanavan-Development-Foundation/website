import NotFound from "@/components/NotFound";
import { getSiteConfig } from "@/config/site";

export async function generateMetadata({}) {
  const { name } = await getSiteConfig();

  return {
    title: `Էջը չի գտնվել | ${name}`,
    description: `Էջը չի գտնվել ${name}`,
  };
}

export default NotFound;
