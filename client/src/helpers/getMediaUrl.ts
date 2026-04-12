import { IImage, IMediaFormat, StrapiImageFormat } from "../models/media";

/**
 * Returns the URL for a Strapi media object.
 *
 * Strapi generates responsive format variants at upload time:
 *   thumbnail (~156px), small (~500px), medium (~750px), large (~1000px)
 *
 * Pass a `format` to use a pre-optimized variant instead of the full original.
 * Falls back to the original URL if the requested format doesn't exist.
 *
 * All image optimization is handled by Strapi on upload — Next.js image
 * optimization (sharp) is intentionally not used. See docs/images.md.
 */
export default function getMediaSrc(
  media: IMediaFormat | IImage | null | undefined,
  format?: StrapiImageFormat,
): string {
  if (!media) return "";

  if (format) {
    const fmt = (media as IImage).formats?.[format];

    if (fmt?.url) return fmt.url;
  }

  return media.url ?? "";
}
