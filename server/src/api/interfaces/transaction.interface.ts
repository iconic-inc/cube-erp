import { HydratedDocument, Model, Types } from 'mongoose';
import { TRANSACTION } from '../constants/transaction.constant';
import { ICustomerPopulate } from './customer.interface';
import { IEmployeePopulate } from './employee.interface';
import { ICaseServicePopulate } from './caseService.interface';

export type ITransactionCategory =
  | Values<typeof TRANSACTION.CATEGORY.INCOME>
  | Values<typeof TRANSACTION.CATEGORY.OUTCOME>;

export interface ITransactionPopulate {
  id: string;
  tx_code: string;
  tx_type: Values<typeof TRANSACTION.TYPE>;
  tx_title: string;
  tx_amount: number;
  tx_paid: number;
  tx_paymentMethod: Values<typeof TRANSACTION.PAYMENT_METHOD>;
  tx_category: ITransactionCategory;
  tx_description?: string;
  tx_createdBy: IEmployeePopulate;
  tx_customer?: ICustomerPopulate;
  tx_caseService?: ICaseServicePopulate;
}

export interface ITransaction {
  id: string;
  tx_code: string;
  tx_type: Values<typeof TRANSACTION.TYPE>;
  tx_title: string;
  tx_amount: number;
  tx_paid: number;
  tx_paymentMethod: Values<typeof TRANSACTION.PAYMENT_METHOD>;
  tx_category: ITransactionCategory;
  tx_description?: string;
  tx_createdBy: Types.ObjectId;
  tx_customer?: Types.ObjectId;
  tx_caseService?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransactionCreate {
  code: ITransaction['tx_code'];
  type: ITransaction['tx_type'];
  title: ITransaction['tx_title'];
  amount: number;
  paid?: number;
  paymentMethod: ITransaction['tx_paymentMethod'];
  category: ITransaction['tx_category'];
  description?: ITransaction['tx_description'];
  createdBy: string;
  customer?: string;
  caseService?: string;
}

export interface ITransactionUpdate extends Partial<ITransactionCreate> {}

export type ITransactionDocument = HydratedDocument<ITransaction>;

export interface ITransactionModel extends Model<ITransactionDocument> {
  build(attrs: ITransactionCreate): Promise<ITransactionDocument>;
}

export interface ITransactionResponse
  extends ITransactionPopulate,
    Omit<ITransaction, 'tx_createdBy' | 'tx_customer' | 'tx_caseService'> {}

export interface ITransactionQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  type?: string;
  paymentMethod?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  customerId?: string;
  caseServiceId?: string;
  createdById?: string;
  amountMin?: number;
  amountMax?: number;
}
