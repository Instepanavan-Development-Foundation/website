import { IImage } from "./image";
import { IProject } from "./project";

export interface IContribution {
  id: number;
  text: string;
  isFeatured: boolean;
  member: {
    id: number;
    email: string;
    fullName: string;
    about: string;
  };
}

export interface IBlog {
  content: string;
  images: IImage[];
  tags: { name: string }[];
  contribution: IContribution[];
  project: IProject;
  isArchive: boolean;
  isFeatured: boolean;
  createdAt: string;
}
