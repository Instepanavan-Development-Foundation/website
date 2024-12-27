import { IBlog } from "./blog";
import { IImage } from "./media";

export interface IProject {
  name: string;
  description: string;
  slug: string;
  blogs: IBlog[];
  donationType: "recurring" | "one time";
  image: IImage;
  isFeatured: boolean;
  about: string;
}
