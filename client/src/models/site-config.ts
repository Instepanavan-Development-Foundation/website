import { IMenuLink } from "./menu";

export interface ISiteConfig {
  title: string;
  siteDescription: string;
  logoTitle: string;
  logo: { url: string };
  contactEmail: string;
  defaultContact: string;
  navItems: IMenuLink[];
  footer: IMenuLink[];
}
