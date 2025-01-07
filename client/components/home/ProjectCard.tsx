import Link from "next/link";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Image } from "@nextui-org/image";
import { ContributorsList } from "../ContributorsList";
import { IProject } from "@/src/models/project";
import getMediaUrl from "@/src/helpers/getMediaUrl";

interface ProjectCardProps {
  title: string;
  description: string;
  tech: string;
  link: string;
  img: string;
  funding: {
    raised: number;
    goal: number;
    currency: string;
  };
  contributors?: {
    name: string;
    avatar: string;
  }[];
}

export function ProjectCard({
  name,
  description,
  about,
  blogs,
  donationType,
  isFeatured,
  image,
  slug,
}: IProject) {
  return (
    <Card
      isPressable
      className="group bg-gradient-to-br from-background to-default-50 w-full"
    >
      <CardBody className="overflow-visible p-0">
      <Image
          alt={name}
          className="w-full object-cover h-[200px] z-10"
          radius="lg"
          shadow="sm"
          src={getMediaUrl(image)}
          width="100%"
        />
        
        <div className="p-5">
          <p className="text-lg text-default-600">
            {name}
          </p>

          <div className="mt-4 flex flex-col gap-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-default-600">
                {"USD"} {30000}
              </span>
              <span className="text-default-400">
                Goal: {"USD"} {50000}
              </span>
            </div>
            <div className="w-full h-2 bg-default-100 rounded-full">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300 ease-in-out"
                style={{
                  width: `${Math.min((3 / 5) * 100, 100)}%`,
                }}
              />
            </div>
            <div className="flex flex-col space-between">
              <div className="flex justify-between items-center">
                <p className="text-xs text-default-400 mt-1">
                  {Math.round((3 / 5) * 100)}% funded
                </p>
                {/* TODO add all contributors */}
                {blogs[0]?.contribution[0]?.contributor && (
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      <ContributorsList contributors={[blogs[0].contribution[0].contributor]} /> {/* TODO add all contributors */}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
