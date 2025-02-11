import getData from "@/src/helpers/getData";
import { IMenu, IMenuLink } from "@/src/models/menu";
import { ISiteConfig } from "@/src/models/site-config";

export const getSiteConfig = async (): Promise<ISiteConfig> => {
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

  const mainMenu =
    menus.find((menu) => menu.title === "Main")?.links || ([] as IMenuLink[]);
  const footerMenu =
    menus.find((menu) => menu.title === "Footer")?.links || ([] as IMenuLink[]);

  const logoUrl = siteConfig?.logo?.url;

  return {
    title: siteConfig.title,
    siteDescription: siteConfig.siteDescription,
    logoTitle: siteConfig.logoTitle,
    logo: { url: String(process.env.NEXT_PUBLIC_BACKEND_URL + logoUrl) },
    contactEmail: siteConfig.contactEmail,
    navItems: mainMenu,
    footer: footerMenu,
    defaultContact: siteConfig.defaultContact,
  };
};
