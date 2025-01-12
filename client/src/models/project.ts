import { IBlog } from "./blog";
import { IImage } from "./media";

export interface IProject {
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
}
