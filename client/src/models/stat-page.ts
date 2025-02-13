import { IMediaFormat } from "./media";

export interface IStaticPage {
  title: string;
  description: string;
  slug: string;
  attachments: IMediaFormat[];
}
