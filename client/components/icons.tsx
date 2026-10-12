import * as React from "react";
import Image from "next/image";

// TODO change to real logo
export const Logo = ({
  size = 36,
  width,
  height,
  src,
  alt,
  ...props
}: {
  size?: number;
  width?: number;
  height?: number;
  src: string;
  alt: string;
  props?: any;
}) => (
  <Image
    alt={alt}
    height={Number(size || height)}
    src={src}
    width={Number(size || width)}
    {...props}
  />
);
