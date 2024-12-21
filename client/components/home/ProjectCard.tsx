import Link from "next/link";
import { Card, CardBody } from "@nextui-org/card";
import { Image } from "@nextui-org/image";
import { ContributorsList } from "../ContributorsList";

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

export function ProjectCard({ title, description, tech, link, img, funding, contributors }: ProjectCardProps) {
    return (
        <Link href={link} className="block">
            <Card isPressable className="group bg-gradient-to-br from-background to-default-50">
                <CardBody className="overflow-visible p-0">
                    <div className="p-5">
                        <p className="text-lg text-default-600 transition-transform duration-200 group-hover:scale-105">
                            {description}
                        </p>

                        <div className="mt-4 flex flex-col gap-2">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-default-600">
                                    {funding.currency} {funding.raised.toLocaleString()}
                                </span>
                                <span className="text-default-400">
                                    Goal: {funding.currency} {funding.goal.toLocaleString()}
                                </span>
                            </div>
                            <div className="w-full h-2 bg-default-100 rounded-full">
                                <div
                                    className="h-full bg-primary rounded-full transition-all duration-300 ease-in-out"
                                    style={{ width: `${Math.min((funding.raised / funding.goal) * 100, 100)}%` }}
                                />
                            </div>
                            <div className="flex flex-col space-between">
                                <div className="flex justify-between items-center">
                                    <p className="text-xs text-default-400 mt-1">
                                        {Math.round((funding.raised / funding.goal) * 100)}% funded
                                    </p>
                                    {contributors && contributors.length > 0 && (
                                        <div className="flex items-center gap-2">
                                            <div className="flex -space-x-2">
                                                <ContributorsList contributors={contributors} /> 
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </CardBody>
            </Card>
        </Link>
    );
} 