"use client";

import Link from "next/link";
import { button as buttonStyles } from "@nextui-org/theme";
import { useEffect, useState } from "react";
import getData from "@/src/helpers/getData";
import { IProject } from "@/src/models/project";

export default function Donation() {
  const [featuredProject, setFeaturedProject] = useState<IProject | null>(null);

  useEffect(() => {
    const fetchFeaturedProject = async () => {
      try {
        const { data } = await getData({
          type: "projects",
          filters: {
            isFeatured: true,
            isArchived: false,
          },
          limit: 1,
        });
        
        if (data && data.length > 0) {
          setFeaturedProject(data[0]);
        }
      } catch (error) {
        console.error("Error fetching featured project:", error);
      }
    };

    fetchFeaturedProject();
  }, []);

  return (
    <div className="w-full container my-16 text-center">
      <h2 className="text-4xl font-bold mb-4">Աջակցեք մեր առաքելությանը</h2>
      <p className="text-default-500 text-xl mb-8 max-w-2xl mx-auto">
        Ձեր ներդրումն օգնում է մեզ շարունակել նորարարական լուծումների կառուցումը
        և աջակցել մեր համայնքին: Յուրաքանչյուր նվիրատվություն տարբերություն է
        ստեղծում:
      </p>
      <Link
        href={featuredProject ? `/donate/${featuredProject.slug}` : "/projects"}
        className={buttonStyles({
          color: "success",
          radius: "full",
          variant: "shadow",
          size: "lg",
        })}
      >
        <span className="text-xl px-8 py-2">Նվիրաբերել հիմա</span>
      </Link>
    </div>
  );
}
