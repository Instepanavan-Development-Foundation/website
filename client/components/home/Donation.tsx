"use client";

import Link from "next/link";
import { button as buttonStyles } from "@nextui-org/theme";
import { useEffect, useState } from "react";
import getData from "@/src/helpers/getData";
import { IProject } from "@/src/models/project";
import { Card } from "@nextui-org/card";

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
    <div className="w-full container my-16">
      <div className="bg-gradient-to-r from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30 rounded-xl p-8 shadow-lg">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400">
            Աջակցեք մեր առաքելությանը
          </h2>
          
          <p className="text-default-600 text-xl mb-8 max-w-2xl mx-auto">
            Ձեր ներդրումն օգնում է մեզ շարունակել կառուցել ուժեղ համայնք: Յուրաքանչյուր նվիրատվություն փոփոխություն է
            բերում:
          </p>
          
          {/* Impact cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <div className="text-3xl font-bold text-primary mb-2">100%</div>
              <p className="text-default-600">Ձեր նվիրատվությունն ուղղվում է ուղղակիորեն ծրագրերին</p>
            </Card>
            <Card className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <div className="text-3xl font-bold text-secondary mb-2">1000+</div>
              <p className="text-default-600">Մարդիկ, ում կյանքը փոխվել է մեր ծրագրերի շնորհիվ</p>
            </Card>
            <Card className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <div className="text-3xl font-bold text-success mb-2">10+</div>
              <p className="text-default-600">Հաջողված ծրագրեր համայնքներում</p>
            </Card>
          </div>
          
          {/* Testimonial */}
          <div className="bg-white/60 dark:bg-gray-800/60 p-4 rounded-lg mb-8 backdrop-blur-sm max-w-2xl mx-auto">
            <p className="italic text-default-600 mb-2">
              "Ինստեփանավանի ծրագրերը փոխեցին մեր համայնքի կյանքը: Նրանց աջակցությունը թույլ տվեց մեզ կառուցել ավելի պայծառ ապագա:"
            </p>
            <p className="text-right text-sm font-semibold">— Մարիամ Սարգսյան, Շահառու</p>
          </div>
          
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
      </div>
    </div>
  );
}
