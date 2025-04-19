import { IMediaFormat } from "./media";

export interface IPaymentMethod {
  id: number;
  name: string;
  description?: string;
  accountNumber?: string;
  bankName?: string;
  icon?: IMediaFormat;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
} 