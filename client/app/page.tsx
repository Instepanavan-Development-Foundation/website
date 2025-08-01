import { HeroSection } from "../components/home/HeroSection";

import Projects from "@/components/home/Projects";
import Blogs from "@/components/home/Blogs";
import TrustedByContributors from "@/components/home/TrustedByContributors";
import Donation from "@/components/home/Donation";

export default async function Home() {
  return (
    <section className="flex flex-col items-center px-4">
      {/* TODO move to backend */}
      <HeroSection
        ctaLink="/archive"
        ctaText="Գնալ արխիվ"
        description="Շուտով նոր Ինստեփանավան"
        imageUrl="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop"
        title="Կայքը վերակառուցվում է"
      />
      <Projects isArchived={false} />
      <Blogs />
      <TrustedByContributors />
      <Donation />
      <Projects isArchived={true} />
    </section>
  );
}
