import { IMediaFormat } from "./media";

export interface IContributor {
  id: number;
  email: string;
  fullName: string;
  about: string;
  slug: string;
  isTrusted: boolean;
  avatar: IMediaFormat;
}
