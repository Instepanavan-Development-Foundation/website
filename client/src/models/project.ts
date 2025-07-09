import { IBlog } from "./blog";
import { IContributor } from "./contributor";
import { IImage, IMediaFormat } from "./media";

export interface IProject {
  gatheredAmount: number;
  requiredAmount: number;
  defaultContact: string;
  fundraisingURL: string;
  events: string | TrustedHTML;
  name: string;
  description: string;
  slug: string;
  blogs: IBlog[];
  donationType: "recurring" | "one time";
  image: IImage;
  isFeatured: boolean;
  about: string;
  createdAt: string;
  isArchived: boolean;
  contributors?: IContributor[];
  slider: {
    images: IMediaFormat[];
    videoIframe: string;
  };
}
