import clsx from "clsx";

import { Image } from "@/components/ui/Image";
import { IImage } from "@/src/models/media";
import getThumbUrl from "@/src/helpers/getThumbUrl";

const MAX_TILES = 4;

/** Grid template and per-tile placement, keyed by the number of visible tiles. */
const layouts: Record<number, { grid: string; tiles: string[] }> = {
  1: { grid: "grid-cols-1 grid-rows-1", tiles: [""] },
  2: { grid: "grid-cols-2 grid-rows-1", tiles: ["", ""] },
  // One large image on the left, two stacked on the right.
  3: { grid: "grid-cols-2 grid-rows-2", tiles: ["row-span-2", "", ""] },
  4: { grid: "grid-cols-2 grid-rows-2", tiles: ["", "", "", ""] },
};

function previewSrc(image: IImage): string {
  return getThumbUrl(image, 320);
}

interface BlogImageGridProps {
  images: IImage[];
  /** Fallback alt text for images without `alternativeText`. */
  alt: string;
  /** Classes for the grid container: a fixed height (keeps cards aligned) and corner radius. */
  className?: string;
  /** Extra classes for the single-image tile (e.g. a background behind `object-contain`). */
  singleImageClassName?: string;
  onOpen: (index: number) => void;
}

/**
 * Social-media style media grid (1 / 2 / 3 / 4 tiles); with more than four
 * images the last tile gets a "+N" overlay. Clicking a tile calls `onOpen`
 * with that image's index.
 */
export function BlogImageGrid({
  images,
  alt,
  className,
  singleImageClassName,
  onOpen,
}: BlogImageGridProps) {
  const visible = images.slice(0, MAX_TILES);
  const hiddenCount = images.length - visible.length;
  const layout = layouts[visible.length];

  if (!layout) return null;

  return (
    <div
      className={clsx(
        "grid w-full gap-0.5 overflow-hidden",
        layout.grid,
        className,
      )}
    >
      {visible.map((image, index) => {
        const isSingle = visible.length === 1;
        const showMore = hiddenCount > 0 && index === visible.length - 1;

        return (
          <button
            key={image.documentId ?? image.id ?? index}
            aria-label={
              showMore
                ? `Դիտել նկարները (ևս ${hiddenCount} նկար)`
                : `Դիտել նկար ${index + 1}`
            }
            className={clsx(
              "relative block h-full min-h-0 w-full min-w-0 cursor-zoom-in overflow-hidden",
              layout.tiles[index],
            )}
            type="button"
            onClick={() => onOpen(index)}
          >
            <Image
              alt={image.alternativeText || `${alt} — նկար ${index + 1}`}
              className={clsx(
                "h-full w-full",
                isSingle
                  ? ["object-contain", singleImageClassName]
                  : "object-cover",
              )}
              decoding="async"
              loading="lazy"
              radius="none"
              src={previewSrc(image)}
            />
            {showMore && (
              <span className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 text-3xl font-semibold text-white">
                +{hiddenCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
