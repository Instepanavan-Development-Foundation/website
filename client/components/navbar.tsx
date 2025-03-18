import {
  Navbar as NextUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
} from "@nextui-org/navbar";
import { Button } from "@nextui-org/button";
import Link from "next/link";
import { link as linkStyles } from "@nextui-org/theme";
import NextLink from "next/link";
import clsx from "clsx";
import { Heart } from "lucide-react";

import { getSiteConfig } from "@/config/site";
import {
  Logo,
} from "@/components/icons";
import { IMenu, IMenuLink } from "@/src/models/menu";

export const Navbar = async () => {
  
  const siteConfig = await getSiteConfig();
  return (
    <NextUINavbar maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-1" href="/">
            <Logo src={siteConfig?.logo?.url} alt={siteConfig.logoTitle} />
            <p className="font-bold text-inherit text-wrap">{siteConfig.logoTitle}</p>
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
                  "data-[active=true]:text-primary data-[active=true]:font-medium"
                )}
                color="foreground"
                href={item.href}
              >
                {item.title}
              </NextLink>
            </NavbarItem>
          ))}
        </ul>
        <NavbarItem className="hidden md:flex">
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
        </NavbarItem>
      </NavbarContent>

      <NavbarContent className="lg:hidden basis-1 pl-4" justify="end">
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
      </NavbarContent>
      <NavbarMenu>
        <div className="mx-4 mt-2 flex flex-col gap-2">
          {siteConfig.navItems.map((item, index) => (
            <NavbarMenuItem key={`${item}-${index}`}>
              <Link
                href={item.href}
              >
                {item.title}
              </Link>
            </NavbarMenuItem>
          ))}
          <NavbarMenuItem>
            <Link href="/donate" className="flex items-center gap-2 text-rose-500 font-medium">
              <Heart size={16} /> Աջակցել մեր առաքելությանը
            </Link>
          </NavbarMenuItem>
        </div>
      </NavbarMenu>
    </NextUINavbar>
  );
};
