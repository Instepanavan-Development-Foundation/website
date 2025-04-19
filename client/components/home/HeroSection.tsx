import Image from "next/image";
import Link from "next/link";
import { button as buttonStyles } from "@nextui-org/theme";

interface HeroSectionProps {
    imageUrl: string;
    title: string;
    description: string;
    ctaLink: string;
    ctaText: string;
}

export const HeroSection = ({ imageUrl, title, description, ctaLink, ctaText }: HeroSectionProps) => {
    return (
        <div className="relative container h-[600px] mb-16">
            <Image
                alt="Hero Image"
                className="w-full h-full object-cover brightness-50"
                src={imageUrl}
                width={1920}
                height={600}
                priority={true}
                loading="eager"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 z-10">
                <h1 className="text-5xl md:text-6xl font-bold text-center mb-6">
                    {title}
                </h1>
                <p className="text-xl md:text-2xl text-center max-w-2xl mb-8">
                    {description}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <Link
                        href={ctaLink}
                        className={buttonStyles({
                            color: "success",
                            radius: "full",
                            variant: "shadow",
                            size: "lg",
                        })}
                    >
                        <span className="text-xl px-8 py-2">{ctaText}</span>
                    </Link>
                    <Link
                        href="/donate"
                        className={buttonStyles({
                            color: "danger",
                            radius: "full",
                            variant: "flat",
                            size: "lg",
                        })}
                    >
                        <span className="text-xl px-8 py-2">Աջակցել մեր առաքելությանը</span>
                    </Link>
                </div>
                
                {/* Impact indicators */}
                <div className="flex flex-wrap justify-center gap-6 mt-12">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 text-center">
                        <div className="text-3xl font-bold">25+</div>
                        <div className="text-sm">Իրականացված ծրագրեր</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 text-center">
                        <div className="text-3xl font-bold">10,000+</div>
                        <div className="text-sm">Շահառուներ</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 text-center">
                        <div className="text-3xl font-bold">150+</div>
                        <div className="text-sm">Կամավորներ</div>
                    </div>
                </div>
            </div>
        </div>
    );
} 