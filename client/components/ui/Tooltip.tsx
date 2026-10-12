"use client";

import type { ReactNode } from "react";

import { Tooltip as HeroTooltip } from "@heroui/react";
import { Focusable } from "react-aria-components";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  showArrow?: boolean;
  /** Classes for the trigger wrapper (defaults to `inline-flex`). */
  className?: string;
}

/**
 * HeroUI v3 tooltip with the v2 call signature and timing (instant open,
 * 500ms close).
 *
 * The trigger is a `<span>` created here, on the client. Children often come
 * from server components, where React 19 may hand them over as lazy
 * references, so they must never be cloned (v2's Tooltip did that and caused
 * hydration mismatches). The span has `tabIndex={-1}` so it adds no extra tab
 * stop next to the link it usually wraps; the tooltip opens on hover, as it
 * did before for these decorative name/text hints.
 */
export function Tooltip({
  content,
  children,
  showArrow = false,
  className = "inline-flex",
}: TooltipProps) {
  return (
    <HeroTooltip closeDelay={500} delay={0}>
      <Focusable>
        <span className={className} tabIndex={-1}>
          {children}
        </span>
      </Focusable>
      <HeroTooltip.Content showArrow={showArrow}>
        {showArrow && <HeroTooltip.Arrow />}
        {content}
      </HeroTooltip.Content>
    </HeroTooltip>
  );
}
