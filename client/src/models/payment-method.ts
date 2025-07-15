export interface IPaymentMethod {
  id: number;
  documentId: string;
  type: string;
  params: {
    [key: string]: any;
  };
  users_permissions_user?: {
    id: number;
    email: string;
    fullName?: string;
  };
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}
