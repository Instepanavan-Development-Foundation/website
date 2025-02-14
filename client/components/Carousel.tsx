"use client";
import { useEffect, useState } from "react";

import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";

import { Image } from "@heroui/image";

import { IProject } from "@/src/models/project";
import getMediaUrl from "@/src/helpers/getMediaUrl";

export default function Carousel({
  slider = {
    images: [],
    videoIframe: "",
  },
  image,
}: {
  slider: IProject["slider"];
  image: IProject["image"];
}) {
  const hasSlides = slider && (slider.images.length + Number(!!slider.videoIframe));
  const hasNoSlides = !hasSlides ;
  const [showArrows, setShowArrows] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [sliderRef, instanceRef] = useKeenSlider({
    initial: 0,
    slideChanged(slider) {
      setCurrentSlide(slider.track.details.rel);
    },
    created() {
      setLoaded(true);
    },
  });

  const height = "h-96";

  if (hasNoSlides || !slider) {
    return (
      <div className="keen-slider">
        <div className="keen-slider__slide">
          <Image
            alt={image.name}
            className={`w-full object-cover ${height}`}
            radius="lg"
            shadow="sm"
            src={getMediaUrl(image)}
            width="100%"
          />
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (hasSlides > 1) {
      setShowArrows(true);
    }
  }, [slider, slider.images, slider.videoIframe]);

  // making video full width even if not full with
  const videoIframe = slider.videoIframe?.replace(
    "iframe",
    `iframe class='w-full ${height}'`
  );

  return (
    <>
      <div className="navigation-wrapper">
        <div ref={sliderRef} className="keen-slider">
          {slider.videoIframe && (
            <div className="keen-slider__slide">
              <div
                className="text-container"
                dangerouslySetInnerHTML={{ __html: videoIframe }}
              />
            </div>
          )}
          {slider.images.map((image, index) => (
            <div className="keen-slider__slide" key={image.id}>
              <Image
                alt={image.name}
                className={`w-full object-cover ${height}`}
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
              onClick={(e) => {
                e.stopPropagation();
                instanceRef.current?.prev();
              }}
              disabled={currentSlide === 0}
            />

            <Arrow
              onClick={(e) => {
                e.stopPropagation();
                instanceRef.current?.next();
              }}
              disabled={
                currentSlide ===
                instanceRef.current.track.details.slides.length - 1
              }
            />
          </>
        )}
      </div>
      {loaded && instanceRef.current && (
        <div className="dots">
          {Array.from(
            { length: instanceRef.current.track.details.slides.length },
            (_, idx) => {
              return (
                <button
                key={idx}
                onClick={() => {
                  instanceRef.current?.moveToIdx(idx);
                }}
                className={"dot" + (currentSlide === idx ? " active" : "")}
              ></button>
            );
          })}
        </div>
      )}
    </>
  );
}

// TODO: Maybe change to lucide-react
function Arrow(props: {
  left?: boolean;
  disabled: boolean;
  onClick: (e: React.MouseEvent<SVGSVGElement>) => void;
}) {
  const disabled = props.disabled ? " arrow--disabled" : "";
  return (
    <svg
      onClick={props.onClick}
      className={`arrow ${
        props.left ? "arrow--left" : "arrow--right"
      } ${disabled}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      stroke="black"
      strokeOpacity="0.5"
      strokeWidth="1"
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
