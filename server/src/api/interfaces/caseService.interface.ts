import { HydratedDocument, Model, Types } from 'mongoose';
import { CASE_SERVICE } from '../constants';
import { ICustomerPopulate } from './customer.interface';
import { IEmployeePopulate } from './employee.interface';
// src/types/finance.ts
export type CurrencyCode = 'USD' | 'VND' | 'EUR' | string;

export interface ICustomerRef {
  _id: string;
  name: string;
  code?: string;
}

export type InstallmentStatus =
  | 'PLANNED'
  | 'DUE'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE';

export interface CaseParticipant {
  employeeId: Types.ObjectId | string; // ref employees
  role?: string;
  commission: {
    type: 'PERCENT_OF_GROSS' | 'PERCENT_OF_NET' | 'FLAT';
    value: number; // percent (0-100) or flat amount in case currency
    transactionId: string | Types.ObjectId; // for audit trail
  };
}

export interface CaseTax {
  name: string; // e.g., VAT 10%
  mode: 'PERCENT' | 'FIXED';
  value: number; // percent (e.g., 10) or fixed amount
  scope: 'ON_BASE' | 'ON_BASE_PLUS_INCIDENTALS'; // tax base selection
  transactionId: string | Types.ObjectId;
}

export interface IncurredCost {
  _id: string; // ObjectId as string
  date: Date | string;
  category: string; // e.g., "Lab Fee", "Shipping"
  description?: string;
  amount: number; // positive number in case currency
  transactionId: string | Types.ObjectId;
}

export interface InstallmentPlanItem {
  _id: string;
  seq: number;
  dueDate: Date | string;
  amount: number; // planned amount
  status: InstallmentStatus;
  paidAmount: number; // derived/updated as payments apply
  notes?: string;
  transactionId: string | Types.ObjectId;
}

export interface ICaseServicePopulate {
  id: string;
  case_customer: ICustomerPopulate;
  case_code: string;
  case_status: Values<typeof CASE_SERVICE.STATUS>;
  case_startDate: Date | string;
  case_endDate?: Date | string;
}

export interface ICaseService {
  id: string;
  case_customer: Types.ObjectId;
  case_code: string;
  case_total: number;
  case_notes?: string;
  case_status: Values<typeof CASE_SERVICE.STATUS>;
  case_startDate: Date | string;
  case_endDate?: Date | string;

  case_pricing: {
    baseAmount: number; // quoted price before tax
    discounts?: number; // optional negative number
    addOns?: number; // optional positive number
    taxes: CaseTax[]; // usually 0..1..n
  };

  case_participants: CaseParticipant[];

  case_installments: InstallmentPlanItem[];

  case_incurredCosts: IncurredCost[];

  // Derived caches (updated by service layer hooks)
  case_totalsCache: {
    scheduled: number; // sum installments.amount
    paid: number; // sum applied payments
    outstanding: number; // scheduled - paid
    taxComputed: number; // computed from pricing + scope
    incurredCostTotal: number; // sum incurredCosts.amount
    commissionTotal: number; // sum commissionSettlements.computedAmount
    netFinal: number; // (base+addons+discounts) - tax - incurred - commissions
    nextDueDate?: Date | null;
    overdueCount: number;
  };

  createdAt: Date;
  updatedAt: Date;
}

export interface ICaseServiceCreate {
  customer: string;
  code: ICaseService['case_code'];
  notes?: ICaseService['case_notes'];
  status?: ICaseService['case_status'];

  participants: ICaseService['case_participants'];

  pricing: ICaseService['case_pricing'];

  installments: ICaseService['case_installments'];

  incurredCosts: ICaseService['case_incurredCosts'];

  totalsCache?: ICaseService['case_totalsCache'];

  startDate?: string | Date;
  endDate?: string | Date;
}

export interface ICaseServiceUpdate extends Partial<ICaseServiceCreate> {}

export type ICaseServiceDocument = HydratedDocument<ICaseService>;

export interface ICaseServiceModel extends Model<ICaseServiceDocument> {
  build(attrs: ICaseServiceCreate): Promise<ICaseServiceDocument>;
}

export interface ICaseServiceResponse
  extends ICaseServicePopulate,
    Omit<ICaseService, 'case_customer'> {}

export interface ICaseServiceQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  startDate?: string;
  endDate?: string;
  customerId?: string;
  employeeUserId?: string;
}
