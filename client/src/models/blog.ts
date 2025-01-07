import { IContributor } from "./contributor";
import { IImage, IMediaFormat } from "./media";
import { IProject } from "./project";

export interface IContribution {
  id: number;
  text: string;
  isFeatured: boolean;
  contributor: IContributor;
}

export interface IBlog {
  content: string;
  images: IImage[];
  tag: { name: string }[];
  contribution: IContribution[];
  project: IProject;
  isArchive: boolean;
  isFeatured: boolean;
  createdAt: string;
  attachments: IMediaFormat[] | null;
}
