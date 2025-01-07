import getData from "@/src/helpers/getData";
import { IMenu } from "@/src/models/menu";


export const getSiteConfig = async () => {
  const { data }: { data: IMenu[] } = await getData({
    type: "menus",
    populate: ['links']
  });

  const mainMenu = data.find((menu) => menu.title === "Main")?.links || [];
  const footerMenu = data.find((menu) => menu.title === "Footer")?.links || [];

  return {
    name: process.env.NEXT_PUBLIC_SITE_TITLE,
    description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION,
    navItems: mainMenu,
    navMenuItems: mainMenu,
    footer: footerMenu,
  };
}
