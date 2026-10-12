import { IImage, IMediaFormat } from "../models/media";

import getMediaSrc from "./getMediaUrl";

// Must match the widths allowed by the /thumb/ location in nginx/nginx.conf.
const THUMB_WIDTHS = [160, 320, 640, 1280, 1920] as const;

const RESIZABLE_UPLOAD = /^\/uploads\/[^?#]+\.(jpe?g|png|webp)$/i;

/**
 * URL of a resized WebP version of an uploaded image, served by Thumbor via nginx
 * (`/thumb/<width>/uploads/<file>`), sized for `displayWidth` CSS pixels on a 2x screen.
 * Non-upload or non-resizable URLs (external, GIF, SVG, ...) are returned unchanged.
 * Without Thumbor (local dev) a Next.js rewrite serves the original instead.
 */
export default function getThumbUrl(
  media: IMediaFormat | IImage | null | undefined,
  displayWidth: number,
): string {
  const url = getMediaSrc(media);

  if (!RESIZABLE_UPLOAD.test(url)) return url;

  const wanted = displayWidth * 2;
  const width =
    THUMB_WIDTHS.find((w) => w >= wanted) ??
    THUMB_WIDTHS[THUMB_WIDTHS.length - 1];

  return `/thumb/${width}${url}`;
}
