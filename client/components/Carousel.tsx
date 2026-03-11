"use client";
import { Image } from "@heroui/image";

import { IProject } from "@/src/models/project";
import getMediaUrl from "@/src/helpers/getMediaUrl";
import EmblaCarousel from "@/components/EmblaCarousel";

interface ICarouselProps {
  slider?: IProject["slider"];
  image?: IProject["image"];
}

export default function Carousel({ slider, image }: ICarouselProps) {
  // Single image case
  if (!slider && image) {
    return (
      <div className="w-full">
        <Image
          alt={image.name}
          className="w-full object-cover h-96"
          radius="lg"
          shadow="sm"
          src={getMediaUrl(image)}
          width="100%"
        />
      </div>
    );
  }

  if (!slider && !image) {
    return null;
  }

  const videoIframe = slider?.videoIframe?.replace(
    "iframe",
    'iframe class="w-full h-96"',
  );

  const slides = [];

  // Add video iframe if exists
  if (slider?.videoIframe) {
    slides.push(
      <div
        dangerouslySetInnerHTML={{ __html: videoIframe || "" }}
        key="video"
        className="text-container"
      />,
    );
  }

  // Add images
  if (slider?.images) {
    slider.images.forEach((image) => {
      slides.push(
        <Image
          key={image.id}
          alt={image.name}
          className="w-full object-cover h-96"
          radius="lg"
          shadow="sm"
          src={getMediaUrl(image)}
          width="100%"
        />,
      );
    });
  }

  return (
    <EmblaCarousel
      autoplay={false}
      loop={false}
      showArrows={slides.length > 1}
      showDots={slides.length > 1}
    >
      {slides}
    </EmblaCarousel>
  );
}
