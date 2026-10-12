"use client";

import Link from "next/link";
import NextLink from "next/link";
import NextImage from "next/image";
import clsx from "clsx";
import { Heart, LogIn, Menu, User, X } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

import { getSiteConfig } from "@/config/site";
import { IMenuLink } from "@/src/models/menu";
import { ISiteConfig } from "@/src/models/site-config";
import { isAuthenticated } from "@/src/services/userService";

const MOBILE_MENU_ID = "mobile-navigation";

function subscribeToLoginState(onChange: () => void) {
  window.addEventListener("loginStateChanged", onChange);

  return () => window.removeEventListener("loginStateChanged", onChange);
}

// HeroUI v3 has no Navbar, so this reproduces the v2 Navbar layout: a sticky
// 64px bar (brand | centered links | actions) and, below `sm`, a toggle that
// opens a full-height menu under the bar with page scroll locked.
export const Navbar = () => {
  // Token lives in localStorage: read it as an external store. The server
  // snapshot is `false`, so SSR/hydration render logged-out as before.
  const isLoggedIn = useSyncExternalStore(
    subscribeToLoginState,
    isAuthenticated,
    () => false,
  );
  const [siteConfig, setSiteConfig] = useState<ISiteConfig | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const config = await getSiteConfig();

      setSiteConfig(config);
    })();
  }, []);

  // While the mobile menu is open: lock page scroll and close on Escape.
  useEffect(() => {
    if (!isMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isMenuOpen]);

  if (!siteConfig) {
    return null;
  }

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="sticky top-0 inset-x-0 z-40 flex h-16 w-full items-center justify-center bg-white border-b border-cream-200">
      <header className="flex h-full w-full max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
        <ul className="flex h-full grow basis-0 items-center justify-start gap-4">
          <li className="flex max-w-fit items-center gap-3">
            <NextLink
              className="flex justify-start items-center gap-2.5"
              href="/"
            >
              {siteConfig?.logo?.url && (
                <NextImage
                  alt={siteConfig.logoTitle || "Ինստեփանավան"}
                  className="h-10 w-10 object-contain"
                  height={40}
                  src={siteConfig.logo.url}
                  width={40}
                />
              )}
              <span className="font-semibold text-[15px] tracking-tight text-ink text-wrap">
                {siteConfig.logoTitle || "Ինստեփանավան"}
              </span>
            </NextLink>
          </li>
        </ul>

        <div className="flex h-full grow basis-0 items-center justify-end sm:hidden">
          <button
            aria-controls={MOBILE_MENU_ID}
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="flex h-10 w-10 items-center justify-center rounded-small text-ink outline-none focus-visible:ring-2 focus-visible:ring-focus"
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? (
              <X aria-hidden="true" size={24} />
            ) : (
              <Menu aria-hidden="true" size={24} />
            )}
          </button>
        </div>

        <div className="hidden h-full items-center justify-center gap-4 sm:flex">
          <ul className="flex items-center gap-1 bg-cream-100 p-1.5 rounded-full">
            {siteConfig.navItems.map((item: IMenuLink) => (
              <li key={item.href} className="flex">
                <NextLink
                  className={clsx(
                    "px-4 py-2 rounded-full text-[13px] text-ink-body hover:text-ink hover:bg-white/60 transition-colors",
                    "data-[active=true]:bg-white data-[active=true]:text-ink data-[active=true]:shadow-sm",
                  )}
                  href={item.href}
                >
                  {item.title}
                </NextLink>
              </li>
            ))}
          </ul>
        </div>

        <ul className="hidden h-full grow basis-0 items-center justify-end gap-2 sm:flex">
          {!isLoggedIn ? (
            <li className="hidden md:flex">
              <NextLink
                className="flex items-center gap-1.5 px-3 py-2 text-[13px] text-ink-body hover:text-primary transition-colors"
                href="/login"
              >
                <LogIn size={16} />
                Մուտք գործել
              </NextLink>
            </li>
          ) : (
            <li className="hidden md:flex">
              <NextLink
                className="flex items-center gap-1.5 px-3 py-2 text-[13px] text-ink-body hover:text-primary transition-colors"
                href="/profile"
              >
                <User size={16} />
                Իմ պրոֆիլը
              </NextLink>
            </li>
          )}
          <li>
            <NextLink
              className="inline-flex items-center gap-1.5 bg-primary text-white px-5 py-2.5 rounded-full text-[13px] font-medium hover:bg-primary-600 transition-colors"
              href={process.env.NEXT_PUBLIC_DONATE_URL ?? "/projects"}
            >
              Աջակցել
              <Heart className="fill-white" size={14} />
            </NextLink>
          </li>
        </ul>
      </header>

      {isMenuOpen && (
        <div
          className="fixed inset-x-0 bottom-0 top-16 z-30 flex flex-col gap-2 overflow-y-auto bg-white px-6 pt-6 sm:hidden"
          id={MOBILE_MENU_ID}
        >
          <ul className="mx-4 mt-2 flex flex-col gap-3">
            {siteConfig.navItems.map((item, index) => (
              <li key={`${item.href}-${index}`}>
                <Link
                  className="text-base text-ink hover:text-primary"
                  href={item.href}
                  onClick={closeMenu}
                >
                  {item.title}
                </Link>
              </li>
            ))}
            {!isLoggedIn ? (
              <li>
                <Link
                  className="flex items-center gap-2 text-base text-ink hover:text-primary"
                  href="/login"
                  onClick={closeMenu}
                >
                  <LogIn size={16} /> Մուտք գործել
                </Link>
              </li>
            ) : (
              <li>
                <Link
                  className="flex items-center gap-2 text-base text-ink hover:text-primary"
                  href="/profile"
                  onClick={closeMenu}
                >
                  <User size={16} /> Իմ պրոֆիլը
                </Link>
              </li>
            )}
            <li>
              <Link
                className="mt-2 inline-flex items-center justify-center gap-1.5 bg-primary text-white px-5 py-3 rounded-full text-sm font-medium w-full"
                href={process.env.NEXT_PUBLIC_DONATE_URL ?? "/projects"}
                onClick={closeMenu}
              >
                Աջակցել
                <Heart className="fill-white" size={14} />
              </Link>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
};
