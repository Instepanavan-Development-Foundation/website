"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { RouterProvider } from "react-aria-components";

function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >;
  }
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    // HeroUI v3 needs no provider; React Aria's RouterProvider keeps client-side
    // navigation for components rendered with an `href` (was HeroUIProvider).
    <RouterProvider navigate={router.push}>
      <ScrollToTop />
      <NextThemesProvider {...themeProps}>{children}</NextThemesProvider>
    </RouterProvider>
  );
}
