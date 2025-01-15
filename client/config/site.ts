import getData from "@/src/helpers/getData";
import { IMenu } from "@/src/models/menu";
import { ISiteConfig } from "@/src/models/site-config";

export const getSiteConfig = async () => {
  const { data: menus }: { data: IMenu[] } = await getData({
    type: "menus",
    populate: ["links"],
  });

  const { data: siteConfig }: { data: ISiteConfig } = await getData({
    type: "site-config",
    populate: {
      logo: { fields: ["url"] },
    },
  });

  const mainMenu = menus.find((menu) => menu.title === "Main")?.links || [];
  const footerMenu = menus.find((menu) => menu.title === "Footer")?.links || [];

  const logoUrl = siteConfig.logo[0].url;
  return {
    name: siteConfig.title,
    description: siteConfig.siteDescription,
    logoTitle: siteConfig.logoTitle,
    logo: process.env.NEXT_PUBLIC_BACKEND_URL + logoUrl,
    navItems: mainMenu,
    navMenuItems: mainMenu,
    footer: footerMenu,
  };
};
