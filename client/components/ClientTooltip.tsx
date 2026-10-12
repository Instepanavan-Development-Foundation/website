"use client";

import { Tooltip, TooltipProps } from "@heroui/tooltip";

type ClientTooltipProps = TooltipProps & { triggerClassName?: string };

// Children from server components reach Tooltip as lazy RSC references during SSR, which it
// wraps in a <p> (but clones directly on the client) → hydration mismatch. A client-created span
// gives it a real element to attach trigger props to on both sides.
export function ClientTooltip({
  children,
  triggerClassName = "inline-flex",
  ...props
}: ClientTooltipProps) {
  return (
    <Tooltip {...props}>
      <span className={triggerClassName}>{children}</span>
    </Tooltip>
  );
}
