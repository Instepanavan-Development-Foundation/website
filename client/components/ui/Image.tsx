import type { ImgHTMLAttributes } from "react";

import clsx from "clsx";

const radiusClasses = {
  none: "rounded-none",
  sm: "rounded-small",
  md: "rounded-medium",
  lg: "rounded-large",
  full: "rounded-full",
} as const;

const shadowClasses = {
  none: "",
  sm: "shadow-small",
  md: "shadow-medium",
} as const;

export interface ImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** Corner radius; ignored when `className` sets its own `rounded-*`. */
  radius?: keyof typeof radiusClasses;
  shadow?: keyof typeof shadowClasses;
}

/**
 * Plain `<img>` with the defaults of the HeroUI v2 `Image` component it
 * replaces (v3 dropped `Image`): large radius and stacking above sibling
 * overlays. Remote CMS URLs are rendered as-is, like before.
 */
export function Image({
  alt,
  className,
  radius = "lg",
  shadow = "none",
  ...props
}: ImageProps) {
  const hasOwnRadius = /(^|\s)rounded(-|\s|$)/.test(className ?? "");

  return (
    <img
      alt={alt}
      className={clsx(
        "relative z-10",
        !hasOwnRadius && radiusClasses[radius],
        shadowClasses[shadow],
        className,
      )}
      {...props}
    />
  );
}
