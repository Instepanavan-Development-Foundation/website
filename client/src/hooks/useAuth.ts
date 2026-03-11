import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

import { isAuthenticated as checkAuth } from "@/src/services/userService";

export function useAuth(redirectTo: string = "/") {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const authenticated = checkAuth();

    if (!authenticated) {
      // Save current URL as returnUrl query parameter
      if (typeof window !== "undefined") {
        const currentUrl = window.location.pathname + window.location.search;
        const loginUrl = `${redirectTo}?returnUrl=${encodeURIComponent(currentUrl)}`;

        router.replace(loginUrl);
      } else {
        router.replace(redirectTo);
      }

      return;
    }

    setIsAuthenticated(true);
    setIsLoading(false);
  }, [redirectTo, router, pathname]);

  return { isAuthenticated, isLoading };
}
