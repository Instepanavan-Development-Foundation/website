import * as React from "react";
import Image from "next/image";

// TODO change to real logo
export const Logo = ({
  size = 36,
  width,
  height,
  src,
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
    src={src}
    width={Number(size || width)}
    height={Number(size || height)}
    // TODO: add alt
    {...props}
  />
);
