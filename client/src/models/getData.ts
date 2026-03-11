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

export interface IDonations {
  id: number;
  amount: number;
  currency: number;
  createdAt: string;
  project: IProject;
}

export interface IProjectPayment {
  id: number;
  documentId: string;
  amount: number;
  currency: number;
  project: IProject;
  type: "recurring" | "one_time";
}

export interface IPaymentLog {
  id: number;
  documentId: string;
  amount: number;
  currency: string;
  success: boolean;
  createdAt: string;
  updatedAt: string;
  project_payment?: {
    name?: string;
    project?: IProject;
  };
  donation?: {
    project?: IProject;
  };
}

export type TypeMapping = {
  projects: IProject[];
  blogs: IBlog[];
  contributors: IContributor[];
  menus: IMenu[];
  donations: IDonations[];
  "project-payments": IProjectPayment[];
  "payment-logs": IPaymentLog[];
  "static-pages": IStaticPage[];
  "site-config": ISiteConfig;
};

export type IUrlTypes = keyof TypeMapping;
