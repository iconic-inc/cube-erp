import { ICustomerBrief } from './customer.interface';
import { IEmployeeBrief } from './employee.interface';
import { ICaseServiceBrief } from './case.interface';

export interface ITransactionBrief {
  id: string;
  tx_code: string;
  tx_type: 'income' | 'outcome';
  tx_title: string;
  tx_amount: number;
  tx_paid: number;
  tx_paymentMethod: string;
  tx_category: string;
  tx_description?: string;
  tx_createdBy: IEmployeeBrief;
  tx_customer?: ICustomerBrief;
  tx_caseService?: ICaseServiceBrief;
  createdAt: string;
  updatedAt: string;
}

export interface ITransaction extends ITransactionBrief {
  // Extended properties if needed
}

export interface ITransactionCreate {
  code: string;
  type: 'income' | 'outcome';
  title: string;
  amount: number;
  paid?: number;
  paymentMethod: string;
  category: string;
  description?: string;
  createdBy: string;
  customer?: string;
  caseService?: string;
}

export interface ITransactionUpdate extends Partial<ITransactionCreate> {}

export interface ITransactionQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  type?: 'income' | 'outcome';
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
