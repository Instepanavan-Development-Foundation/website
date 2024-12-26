import { IBlog } from "./blog";
import { IImage } from "./image";

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
