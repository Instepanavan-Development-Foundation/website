export interface IStaticPage {
  title: string;
  description: string;
  slug: string;
  attachments: {
    name: string;
    url: string;
  }[];
}
