import { Card, CardBody } from "@heroui/card";
import { Image } from "@heroui/image";
import { HeartHandshake } from "lucide-react";

import { ContributorsList } from "../ContributorsList";

import { IProject } from "@/src/models/project";
import getMediaUrl from "@/src/helpers/getMediaUrl";

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
  // Calculate remaining amount and percentage
  const remainingAmount = Math.max(requiredAmount - gatheredAmount, 0);
  const percentComplete = requiredAmount
    ? Math.round((gatheredAmount / requiredAmount) * 100)
    : 100;
  const isUrgent = percentComplete < 30;

  return (
    <div className="relative w-full">
      <Card className="group bg-gradient-to-br from-background to-default-50 w-full hover:shadow-lg transition-all duration-300">
        <CardBody className="overflow-visible p-0">
          <div className="relative">
            <Image
              alt={name}
              className="w-full object-cover h-[200px] z-10"
              radius="lg"
              shadow="sm"
              src={getMediaUrl(image)}
              width="100%"
            />
            {isUrgent && (
              <div className="absolute top-3 left-3 bg-danger text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse z-20">
                Հրատապ օգնության կարիք
              </div>
            )}
          </div>

          <div className="p-5">
            {/* Project name should be one line */}
            <p className="text-lg text-default-600 line-clamp-1 font-semibold">
              {name}
            </p>

            {/* Short description */}
            <p className="text-sm text-default-500 mt-1 line-clamp-2 h-10">
              {description}
            </p>

            <div className="mt-4 flex flex-col gap-2">
              <div
                className={`flex justify-between text-sm mb-1 ${!requiredAmount ? "opacity-0" : ""}`}
              >
                <span className="text-default-600 font-medium">
                  {formatCurrency(gatheredAmount)}
                </span>
                <span className="text-default-400">
                  Goal: {formatCurrency(requiredAmount)}
                </span>
              </div>
              <div className="w-full h-3 bg-default-100 rounded-full">
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

              {/* Donation stats */}
              <div className="flex flex-col space-between">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <p
                      className={`text-xs text-default-400 mt-1 ${!requiredAmount ? "opacity-0" : ""}`}
                    >
                      {requiredAmount ? `${percentComplete}%` : "100%"} հավաքված
                    </p>
                    {remainingAmount > 0 && (
                      <p className="text-xs text-danger font-medium mt-1">
                        Մնացել է {formatCurrency(remainingAmount)}
                      </p>
                    )}
                  </div>

                  {
                    <div className="flex items-center gap-2 h-10">
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
        <div className="absolute -top-3 -right-3 z-30 bg-danger rounded-full w-12 h-12 flex items-center justify-center shadow-md">
          <HeartHandshake className="w-6 h-6 text-white" />
        </div>
      )}
    </div>
  );
}
