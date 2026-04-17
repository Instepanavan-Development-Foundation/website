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
import { Button } from "@heroui/button";
import Link from "next/link";
import { link as linkStyles } from "@heroui/theme";
import NextLink from "next/link";
import clsx from "clsx";
import { LogIn, User } from "lucide-react";
import { useEffect, useState } from "react";

import { getSiteConfig } from "@/config/site";
import { Logo } from "@/components/icons";
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

    // Listen for login state changes
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
      isMenuOpen={isMenuOpen}
      maxWidth="xl"
      position="sticky"
      onMenuOpenChange={setIsMenuOpen}
    >
      <NavbarContent justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-1" href="/">
            <Logo alt={siteConfig.logoTitle} src={siteConfig?.logo?.url} />
            <p className="font-bold text-inherit text-wrap">
              {siteConfig.logoTitle}
            </p>
          </NextLink>
        </NavbarBrand>
      </NavbarContent>
      <NavbarContent className="sm:hidden" justify="end">
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        />
      </NavbarContent>
      <NavbarContent className="hidden sm:flex gap-4" justify="end">
        <ul className="flex gap-4">
          {siteConfig.navItems.map((item: IMenuLink) => (
            <NavbarItem key={item.href}>
              <NextLink
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  "data-[active=true]:text-primary data-[active=true]:font-medium",
                )}
                color="foreground"
                href={item.href}
              >
                {item.title}
              </NextLink>
            </NavbarItem>
          ))}
        </ul>
        {!isLoggedIn ? (
          <NavbarItem className="hidden md:flex">
            <NextLink
              className={clsx(
                linkStyles({ color: "foreground" }),
                "data-[active=true]:text-primary data-[active=true]:font-medium",
              )}
              color="foreground"
              href={"/login"}
            >
              <LogIn size={18} />
              Մուտք գործել
            </NextLink>
          </NavbarItem>
        ) : (
          <NavbarItem className="hidden md:flex">
            <NextLink
              className={clsx(
                linkStyles({ color: "foreground" }),
                "data-[active=true]:text-primary data-[active=true]:font-medium",
              )}
              color="foreground"
              href={"/profile"}
            >
              <User size={18} />
              Իմ պրոֆիլը
            </NextLink>
          </NavbarItem>
        )}
        {/* <NavbarItem className="hidden md:flex">
          <Button
            as={Link}
            className="text-sm font-normal text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:from-rose-500 hover:to-pink-500 transition-all duration-300 shadow-md hover:shadow-lg"
            href="/donate"
            startContent={<Heart className="text-white" size={18} />}
            variant="flat"
            size="md"
          >
            Աջակցել հիմա
          </Button>
        </NavbarItem> */}
      </NavbarContent>

      <NavbarMenu>
        <div className="mx-4 mt-2 flex flex-col gap-2">
          {siteConfig.navItems.map((item, index) => (
            <NavbarMenuItem key={`${item}-${index}`}>
              <Link href={item.href} onClick={() => setIsMenuOpen(false)}>
                {item.title}
              </Link>
            </NavbarMenuItem>
          ))}
          {!isLoggedIn ? (
            <NavbarMenuItem>
              <Link
                className="flex items-center gap-2"
                href="/login"
                onClick={() => setIsMenuOpen(false)}
              >
                <LogIn size={16} /> Մուտք գործել
              </Link>
            </NavbarMenuItem>
          ) : (
            <NavbarMenuItem>
              <Link
                className="flex items-center gap-2"
                href="/profile"
                onClick={() => setIsMenuOpen(false)}
              >
                <User size={16} /> Իմ պրոֆիլը
              </Link>
            </NavbarMenuItem>
          )}
        </div>
      </NavbarMenu>
    </NextUINavbar>
  );
};
