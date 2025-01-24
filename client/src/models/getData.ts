import { IProject } from "./project";
import { IBlog } from "./blog";
import { IContributor } from "./contributor";
import { ISiteConfig } from "./site-config";
import { IMenu } from "./menu";
import { IStaticPage } from "./stat-page";

export type INestedObject = {
  [key: string]:
    | string
    | number
    | boolean
    | null
    | INestedObject
    | INestedObject[]
    | string[];
};

export interface IDataParams<T extends IUrlTypes> {
  type: T;
  populate?: INestedObject | string[];
  filters?: INestedObject;
  params?: INestedObject;
  fields?: string[];
  sort?: string | string[];
  offset?: number;
  limit?: number;
}

export type TypeMapping = {
  projects: IProject[];
  blogs: IBlog[];
  contributors: IContributor[];
  menus: IMenu[];
  "static-pages": IStaticPage[];
  "site-config": ISiteConfig;
};

export type IUrlTypes = keyof TypeMapping;
