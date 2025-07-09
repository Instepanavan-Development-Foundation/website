"use client";
import { useEffect, useState } from "react";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";

import { Image } from "@heroui/image";

import { IProject } from "@/src/models/project";
import getMediaUrl from "@/src/helpers/getMediaUrl";

interface ICarouselProps {
  slider?: IProject["slider"];
  image?: IProject["image"];
}

export default function Carousel({ slider, image }: ICarouselProps) {
  const [showArrows, setShowArrows] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const totalSlides =
    (slider?.images?.length || 0) + (slider?.videoIframe ? 1 : 0);

  if (!slider && image) {
    return (
      <div className="keen-slider">
        <div className="keen-slider__slide">
          <Image
            alt={image.name}
            className="w-full object-cover h-96"
            radius="lg"
            shadow="sm"
            src={getMediaUrl(image)}
            width="100%"
          />
        </div>
      </div>
    );
  }

  if (!slider && !image) {
    return null;
  }

  const [sliderRef, instanceRef] = useKeenSlider({
    initial: 0,
    slideChanged(slider) {
      setCurrentSlide(slider.track.details.rel);
    },
    created() {
      setLoaded(true);
    },
  });

  useEffect(() => {
    setShowArrows(totalSlides > 1);
  }, [totalSlides]);

  const videoIframe = slider?.videoIframe?.replace(
    "iframe",
    'iframe class="w-full h-96"',
  );

  return (
    <>
      <div className="navigation-wrapper">
        <div ref={sliderRef} className="keen-slider">
          {slider?.videoIframe && (
            <div className="keen-slider__slide">
              <div
                dangerouslySetInnerHTML={{ __html: videoIframe || "" }}
                className="text-container"
              />
            </div>
          )}
          {slider?.images?.map((image) => (
            <div key={image.id} className="keen-slider__slide">
              <Image
                alt={image.name}
                className="w-full object-cover h-96"
                radius="lg"
                shadow="sm"
                src={getMediaUrl(image)}
                width="100%"
              />
            </div>
          ))}
        </div>
        {loaded && instanceRef.current && showArrows && (
          <>
            <Arrow
              left
              disabled={currentSlide === 0}
              onClick={(e) => {
                e.stopPropagation();
                instanceRef.current?.prev();
              }}
            />
            <Arrow
              disabled={currentSlide === totalSlides - 1}
              onClick={(e) => {
                e.stopPropagation();
                instanceRef.current?.next();
              }}
            />
          </>
        )}
      </div>
      {loaded && instanceRef.current && totalSlides > 1 && (
        <div className="dots">
          {[...Array(totalSlides)].map((_, idx) => (
            <button
              key={idx}
              className={`dot${currentSlide === idx ? " active" : ""}`}
              onClick={() => {
                instanceRef.current?.moveToIdx(idx);
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}

// TODO: Maybe change to lucide-react, though not necessarily for this component
function Arrow(props: {
  left?: boolean;
  disabled: boolean;
  onClick: (e: React.MouseEvent<SVGSVGElement>) => void;
}) {
  const disabled = props.disabled ? " arrow--disabled" : "";

  return (
    <svg
      className={`arrow ${
        props.left ? "arrow--left" : "arrow--right"
      } ${disabled}`}
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
