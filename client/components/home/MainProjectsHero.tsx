"use client";
import Link from "next/link";
import { Card, CardBody } from "@heroui/card";
import { Image } from "@heroui/image";

import { formatCurrency } from "./ProjectCard";

import { IProject } from "@/src/models/project";
import getMediaUrl from "@/src/helpers/getMediaUrl";
import EmblaCarousel from "@/components/EmblaCarousel";

interface MainProjectsHeroProps {
  projects: IProject[];
}

export default function MainProjectsHero({ projects }: MainProjectsHeroProps) {
  if (!projects || projects.length === 0) {
    return null;
  }

  const slides = projects.map((project) => {
    const gatheredAmount = project.gatheredAmount ?? 0;
    const requiredAmount = project.requiredAmount ?? 0;

    const remainingAmount = Math.max(requiredAmount - gatheredAmount, 0);
    const percentComplete = requiredAmount
      ? Math.round((gatheredAmount / requiredAmount) * 100)
      : 100;
    const isUrgent = percentComplete < 30;

    return (
      <div key={project.documentId} className="w-full h-full">
        <Link href={`/project/${project.slug}`}>
          <Card className="group bg-gradient-to-br from-background to-default-50 w-full hover:shadow-2xl transition-all duration-300 cursor-pointer">
            <CardBody className="overflow-visible p-0">
              <div className="relative">
                <Image
                  alt={project.name}
                  className="w-full object-cover h-[400px] md:h-[500px] z-10"
                  radius="lg"
                  shadow="sm"
                  src={getMediaUrl(project.image)}
                  width="100%"
                />
                {isUrgent && (
                  <div className="absolute top-4 left-4 bg-danger text-white text-sm font-bold px-4 py-2 rounded-full animate-pulse z-20">
                    Հրատապ օգնության կարիք
                  </div>
                )}
              </div>

              <div className="p-8">
                <h2 className="text-3xl md:text-4xl font-bold text-default-800 mb-3">
                  {project.name}
                </h2>

                <p className="text-lg text-default-600 mb-6 line-clamp-3">
                  {project.description}
                </p>

                {requiredAmount > 0 && (
                  <div>
                    <div className="flex justify-between text-base mb-2">
                      <span className="text-default-700 font-semibold">
                        {formatCurrency(gatheredAmount)}
                      </span>
                      <span className="text-default-500">
                        Նպատակ: {formatCurrency(requiredAmount)}
                      </span>
                    </div>
                    <div className="w-full h-4 bg-default-100 rounded-full">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ease-in-out ${
                          gatheredAmount >= requiredAmount
                            ? "bg-primary"
                            : gatheredAmount >= requiredAmount / 2
                              ? "bg-secondary"
                              : "bg-danger"
                        }`}
                        style={{
                          width: `${Math.min((gatheredAmount / requiredAmount) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-sm text-default-500">
                        {percentComplete}% հավաքված
                      </p>
                      {remainingAmount > 0 && (
                        <p className="text-sm text-danger font-medium">
                          Մնացել է {formatCurrency(remainingAmount)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </Link>
      </div>
    );
  });

  return (
    <div className="w-full mb-16 container">
      <EmblaCarousel
        autoplay={projects.length > 1}
        autoplayDelay={5000}
        loop={projects.length > 1}
        showArrows={projects.length > 1}
        showDots={projects.length > 1}
      >
        {slides}
      </EmblaCarousel>
    </div>
  );
}
