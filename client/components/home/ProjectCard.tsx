import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Image } from "@heroui/image";
import { ContributorsList } from "../ContributorsList";
import { IProject } from "@/src/models/project";
import getMediaUrl from "@/src/helpers/getMediaUrl";
import { HeartHandshake } from "lucide-react";


export const formatCurrency = (amount: number, currency: string = "AMD") => {
  return new Intl.NumberFormat("hy-AM", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function ProjectCard({
  name,
  description,
  about,
  blogs,
  donationType,
  isFeatured,
  image,
  slug,
  gatheredAmount,
  requiredAmount,
}: IProject) {
  return (
    <div className="relative w-full">
      <Card
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
            {/* Project name should be one line */}
            <p className="text-lg text-default-600 line-clamp-1">{name}</p>

            <div className="mt-4 flex flex-col gap-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-default-600">
                  {formatCurrency(gatheredAmount)}
                </span>
                <span className="text-default-400">
                  Goal: {formatCurrency(requiredAmount)}
                </span>
              </div>
              <div className="w-full h-2 bg-default-100 rounded-full">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300 ease-in-out"
                  style={{
                    width: `${Math.min((gatheredAmount / requiredAmount) * 100, 100)}%`,
                  }}
                />
              </div>
              <div className="flex flex-col space-between">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-default-400 mt-1">
                    {/* TODO: move to separate helper and handle NaN */}
                    {Math.round((gatheredAmount / requiredAmount) * 100)}%
                    funded
                  </p>
                  {
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        <ContributorsList
                          contributions={blogs
                            .map(({ contribution }) => contribution)
                            .flat()}
                        />
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
      {isFeatured && (
        <div className="absolute -top-3 -right-3 z-30 bg-danger rounded-full w-12 h-12 flex items-center justify-center">
          <HeartHandshake className="w-6 h-6 text-white" />
        </div>
      )}
    </div>
  );
}
