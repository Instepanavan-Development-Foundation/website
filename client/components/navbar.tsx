"use client";

import {
  Navbar as NextUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
} from "@heroui/navbar";
import Link from "next/link";
import NextLink from "next/link";
import NextImage from "next/image";
import clsx from "clsx";
import { Heart, LogIn, User } from "lucide-react";
import { useEffect, useState } from "react";

import { getSiteConfig } from "@/config/site";
import { IMenuLink } from "@/src/models/menu";
import { ISiteConfig } from "@/src/models/site-config";
import { isAuthenticated } from "@/src/services/userService";

export const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [siteConfig, setSiteConfig] = useState<ISiteConfig | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsLoggedIn(isAuthenticated());
    (async () => {
      const config = await getSiteConfig();

      setSiteConfig(config);
    })();

    const handleLoginStateChange = () => {
      setIsLoggedIn(isAuthenticated());
    };

    window.addEventListener("loginStateChanged", handleLoginStateChange);

    return () => {
      window.removeEventListener("loginStateChanged", handleLoginStateChange);
    };
  }, []);

  if (!siteConfig) {
    return null;
  }

  return (
    <NextUINavbar
      classNames={{
        base: "bg-white border-b border-cream-200",
        wrapper: "px-4 md:px-8 max-w-7xl",
      }}
      isMenuOpen={isMenuOpen}
      maxWidth="xl"
      position="sticky"
      onMenuOpenChange={setIsMenuOpen}
    >
      <NavbarContent justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
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
            <span className="font-semibold text-[15px] tracking-tight text-ink">
              {siteConfig.logoTitle || "Ինստեփանավան"}
            </span>
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="sm:hidden" justify="end">
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        />
      </NavbarContent>

      <NavbarContent className="hidden sm:flex" justify="center">
        <div className="flex items-center gap-1 bg-cream-100 p-1.5 rounded-full">
          {siteConfig.navItems.map((item: IMenuLink) => (
            <NavbarItem key={item.href} className="list-none">
              <NextLink
                className={clsx(
                  "px-4 py-2 rounded-full text-[13px] text-ink-body hover:text-ink hover:bg-white/60 transition-colors",
                  "data-[active=true]:bg-white data-[active=true]:text-ink data-[active=true]:shadow-sm",
                )}
                href={item.href}
              >
                {item.title}
              </NextLink>
            </NavbarItem>
          ))}
        </div>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex gap-2" justify="end">
        {!isLoggedIn ? (
          <NavbarItem className="hidden md:flex">
            <NextLink
              className="flex items-center gap-1.5 px-3 py-2 text-[13px] text-ink-body hover:text-primary transition-colors"
              href="/login"
            >
              <LogIn size={16} />
              Մուտք գործել
            </NextLink>
          </NavbarItem>
        ) : (
          <NavbarItem className="hidden md:flex">
            <NextLink
              className="flex items-center gap-1.5 px-3 py-2 text-[13px] text-ink-body hover:text-primary transition-colors"
              href="/profile"
            >
              <User size={16} />
              Իմ պրոֆիլը
            </NextLink>
          </NavbarItem>
        )}
        <NavbarItem>
          <NextLink
            className="inline-flex items-center gap-1.5 bg-primary text-white px-5 py-2.5 rounded-full text-[13px] font-medium hover:bg-primary-600 transition-colors"
            href="/donate"
          >
            Աջակցել
            <Heart className="fill-white" size={14} />
          </NextLink>
        </NavbarItem>
      </NavbarContent>

      <NavbarMenu className="bg-white pt-6">
        <div className="mx-4 mt-2 flex flex-col gap-3">
          {siteConfig.navItems.map((item, index) => (
            <NavbarMenuItem key={`${item.href}-${index}`}>
              <Link
                className="text-base text-ink hover:text-primary"
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.title}
              </Link>
            </NavbarMenuItem>
          ))}
          {!isLoggedIn ? (
            <NavbarMenuItem>
              <Link
                className="flex items-center gap-2 text-base text-ink hover:text-primary"
                href="/login"
                onClick={() => setIsMenuOpen(false)}
              >
                <LogIn size={16} /> Մուտք գործել
              </Link>
            </NavbarMenuItem>
          ) : (
            <NavbarMenuItem>
              <Link
                className="flex items-center gap-2 text-base text-ink hover:text-primary"
                href="/profile"
                onClick={() => setIsMenuOpen(false)}
              >
                <User size={16} /> Իմ պրոֆիլը
              </Link>
            </NavbarMenuItem>
          )}
          <NavbarMenuItem>
            <Link
              className="mt-2 inline-flex items-center justify-center gap-1.5 bg-primary text-white px-5 py-3 rounded-full text-sm font-medium w-full"
              href="/donate"
              onClick={() => setIsMenuOpen(false)}
            >
              Աջակցել
              <Heart className="fill-white" size={14} />
            </Link>
          </NavbarMenuItem>
        </div>
      </NavbarMenu>
    </NextUINavbar>
  );
};
