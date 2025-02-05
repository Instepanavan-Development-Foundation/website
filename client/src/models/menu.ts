export interface IMenuLink {
  title: string;
  href: string;
  id: number;
}

export interface IMenu {
  title: string;
  links: IMenuLink[];
}
