"use client";

import {
  Navbar as NextUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import Link from "next/link";
import { link as linkStyles } from "@heroui/theme";
import NextLink from "next/link";
import clsx from "clsx";
import { Heart, LogIn, LogOut, User } from "lucide-react";
import { useEffect, useState } from "react";

import { getSiteConfig } from "@/config/site";
import { Logo } from "@/components/icons";
import { IMenuLink } from "@/src/models/menu";
import { ISiteConfig } from "@/src/models/site-config";

export const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [siteConfig, setSiteConfig] = useState<ISiteConfig | null>(null);

  useEffect(() => {
    setIsLoggedIn(
      typeof window !== "undefined" && !!localStorage.getItem("jwt"),
    );
    (async () => {
      const config = await getSiteConfig();

      setSiteConfig(config);
    })();

    // Listen for login state changes
    const handleLoginStateChange = () => {
      setIsLoggedIn(
        typeof window !== "undefined" && !!localStorage.getItem("jwt"),
      );
    };

    window.addEventListener("loginStateChanged", handleLoginStateChange);

    return () => {
      window.removeEventListener("loginStateChanged", handleLoginStateChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    localStorage.removeItem("email");
    setIsLoggedIn(false);
    // Dispatch custom event to notify other components of logout
    window.dispatchEvent(new CustomEvent("loginStateChanged"));
    window.location.reload();
  };

  if (!siteConfig) {
    return null;
  }

  return (
    <NextUINavbar maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-1" href="/">
            <Logo alt={siteConfig.logoTitle} src={siteConfig?.logo?.url} />
            <p className="font-bold text-inherit text-wrap">
              {siteConfig.logoTitle}
            </p>
          </NextLink>
        </NavbarBrand>
      </NavbarContent>
      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        <ul className="hidden lg:flex gap-4 justify-start ml-2">
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
          <>
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
            <NavbarItem className="hidden md:flex">
              <Button color="warning" onClick={handleLogout}>
                <LogOut size={18} />
                Դուրս գալ
              </Button>
            </NavbarItem>
          </>
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

      {/* <NavbarContent className="lg:hidden basis-1 pl-4" justify="end">
        <Button
          as={Link}
          className="text-sm font-normal text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:from-rose-500 hover:to-pink-500 transition-all duration-300"
          href="/donate"
          size="sm"
          startContent={<Heart className="text-white" size={16} />}
          variant="flat"
        >
          Աջակցել
        </Button>
        <NavbarMenuToggle />
      </NavbarContent> */}
      <NavbarMenu>
        <div className="mx-4 mt-2 flex flex-col gap-2">
          {siteConfig.navItems.map((item, index) => (
            <NavbarMenuItem key={`${item}-${index}`}>
              <Link href={item.href}>{item.title}</Link>
            </NavbarMenuItem>
          ))}
          <NavbarMenuItem>
            <Link
              className="flex items-center gap-2 text-rose-500 font-medium"
              href="/donate"
            >
              <Heart size={16} /> Աջակցել մեր առաքելությանը
            </Link>
          </NavbarMenuItem>
        </div>
      </NavbarMenu>
    </NextUINavbar>
  );
};
