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
  tx_date: string; // ISO date string
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
  createdBy?: string;
  customer?: string;
  caseService?: string;
  date?: string; // Optional, defaults to current date
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

export interface ITransactionStats {
  totalIncome: number;
  totalOutcome: number;
  totalPaid: number;
  totalUnpaid: number;
  transactionCount: number;
  netAmount: number;
  debtCount: number;
  averageTransactionAmount: number;
  paymentRatio: number;

  byCategory: Array<{
    category: string;
    income: number;
    outcome: number;
    total: number;
    count: number;
  }>;

  byDay: Array<{
    date: string;
    year: number;
    month: number;
    day: number;
    income: number;
    outcome: number;
    net: number;
    count: number;
  }>;

  byProvince: Array<{
    province: string;
    income: number;
    outcome: number;
    total: number;
    net: number;
    count: number;
    customerCount: number;
  }>;
}
