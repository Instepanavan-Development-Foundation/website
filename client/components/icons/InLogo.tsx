import * as React from "react";

interface InLogoProps {
  size?: number;
  color?: string;
  className?: string;
}

export function InLogo({
  size = 40,
  color = "#E65A2A",
  className,
}: InLogoProps) {
  return (
    <svg
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 80 80"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="none" stroke={color} strokeWidth="2">
        <path d="M14 14 L14 68 L24 68 L24 14 Z" />
        <path d="M18 20 L18 62 L28 62 L28 20 Z" />
        <path d="M22 26 L22 56 L32 56 L32 26 Z" />
      </g>
      <g fill="none" stroke={color} strokeWidth="2">
        <path d="M48 14 L48 68 L58 68 L58 14 Z" />
        <path d="M52 20 L52 62 L62 62 L62 20 Z" />
        <path d="M56 26 L56 56 L66 56 L66 26 Z" />
      </g>
      <text
        fill={color}
        fontFamily="Inter, sans-serif"
        fontSize="14"
        fontWeight="400"
        textAnchor="middle"
        x="40"
        y="46"
      >
        in
      </text>
    </svg>
  );
}
