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

  const normalizeHref = (links: IMenuLink[]) =>
    links.map((link) => ({
      ...link,
      href: link.href.startsWith("/") || link.href.startsWith("http") ? link.href : `/${link.href}`,
    }));

  const mainMenu = normalizeHref(
    menus.find((menu) => menu.title === "Main")?.links || [],
  );
  const footerMenu = normalizeHref(
    menus.find((menu) => menu.title === "Footer")?.links || [],
  );
  const footerSocialMenu = normalizeHref(
    menus.find((menu) => menu.title === "Footer Social")?.links || [],
  );

  const logoUrl = siteConfig?.logo?.url;

  return {
    title: siteConfig.title,
    siteDescription: siteConfig.siteDescription,
    logoTitle: siteConfig.logoTitle,
    logo: { url: String(process.env.NEXT_PUBLIC_BACKEND_URL + logoUrl) },
    contactEmail: siteConfig.contactEmail,
    navItems: mainMenu,
    footer: footerMenu,
    footerSocial: footerSocialMenu,
    defaultContact: siteConfig.defaultContact,
  };
};
