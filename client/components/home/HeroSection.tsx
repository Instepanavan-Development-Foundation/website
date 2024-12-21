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
            </div>
        </div>
    );
} 