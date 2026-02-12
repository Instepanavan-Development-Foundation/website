"use client";
import { useCallback, useEffect, useState, ReactNode } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

interface EmblaCarouselProps {
  children: ReactNode[];
  autoplay?: boolean;
  autoplayDelay?: number;
  showArrows?: boolean;
  showDots?: boolean;
  loop?: boolean;
  className?: string;
}

export default function EmblaCarousel({
  children,
  autoplay = false,
  autoplayDelay = 5000,
  showArrows = true,
  showDots = true,
  loop = true,
  className = "",
}: EmblaCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const hasMultipleSlides = children.length > 1;

  const plugins = hasMultipleSlides && autoplay
    ? [Autoplay({ delay: autoplayDelay, stopOnInteraction: true })]
    : [];

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: loop && hasMultipleSlides },
    plugins
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentSlide(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  if (!children || children.length === 0) {
    return null;
  }

  return (
    <>
      <div className={`embla ${className}`}>
        <div className="navigation-wrapper">
          <div className="embla__viewport" ref={emblaRef}>
            <div className="embla__container">
              {children.map((child, index) => (
                <div key={index} className="embla__slide">
                  {child}
                </div>
              ))}
            </div>
          </div>
          {hasMultipleSlides && showArrows && (
            <>
              <Arrow
                left
                onClick={(e) => {
                  e.stopPropagation();
                  scrollPrev();
                }}
              />
              <Arrow
                onClick={(e) => {
                  e.stopPropagation();
                  scrollNext();
                }}
              />
            </>
          )}
        </div>
      </div>
      {hasMultipleSlides && showDots && (
        <div className="dots mt-6">
          {children.map((_, idx) => (
            <button
              key={idx}
              className={`dot${currentSlide === idx ? " active" : ""}`}
              onClick={() => scrollTo(idx)}
            />
          ))}
        </div>
      )}
    </>
  );
}

function Arrow(props: {
  left?: boolean;
  onClick: (e: React.MouseEvent<SVGSVGElement>) => void;
}) {
  return (
    <svg
      className={`arrow ${props.left ? "arrow--left" : "arrow--right"}`}
      stroke="black"
      strokeOpacity="0.5"
      strokeWidth="1"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      onClick={props.onClick}
    >
      {props.left && (
        <path d="M16.67 0l2.83 2.829-9.339 9.175 9.339 9.167-2.83 2.829-12.17-11.996z" />
      )}
      {!props.left && (
        <path d="M5 3l3.057-3 11.943 12-11.943 12-3.057-3 9-9z" />
      )}
    </svg>
  );
}
