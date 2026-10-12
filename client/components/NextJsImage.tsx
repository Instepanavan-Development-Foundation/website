import {
  isImageFitCover,
  isImageSlide,
  useLightboxProps,
  useLightboxState,
} from "yet-another-react-lightbox";

function isNextJsImage(slide: any) {
  return (
    isImageSlide(slide) &&
    typeof slide.width === "number" &&
    typeof slide.height === "number"
  );
}

export default function NextJsImage({
  slide,
  offset,
  rect,
}: {
  slide: any;
  offset: number;
  rect: any;
}) {
  const {
    on: { click },
    carousel: { imageFit },
  } = useLightboxProps();

  const { currentIndex } = useLightboxState();

  const cover = isImageSlide(slide) && isImageFitCover(slide, imageFit);

  if (!isNextJsImage(slide)) return undefined;

  const width = !cover
    ? Math.round(
        Math.min(rect.width, (rect.height / slide.height) * slide.width),
      )
    : rect.width;

  const height = !cover
    ? Math.round(
        Math.min(rect.height, (rect.width / slide.width) * slide.height),
      )
    : rect.height;

  const handleClick =
    click && offset === 0 ? () => click({ index: currentIndex }) : undefined;

  const image = (
    <img
      alt=""
      draggable={false}
      loading="eager"
      src={slide.src}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        objectFit: cover ? "cover" : "contain",
        cursor: click ? "pointer" : undefined,
      }}
    />
  );

  return (
    <div style={{ position: "relative", width, height }}>
      {handleClick ? (
        // Native button gives keyboard + screen-reader support for clickable slides.
        <button
          aria-label="Open image"
          style={{
            position: "absolute",
            inset: 0,
            padding: 0,
            border: 0,
            background: "none",
          }}
          type="button"
          onClick={handleClick}
        >
          {image}
        </button>
      ) : (
        image
      )}
    </div>
  );
}
