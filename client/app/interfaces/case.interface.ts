import { CASE_SERVICE } from '~/constants/caseService.constant';
import { ICustomerBrief } from './customer.interface';
import { IEmployeeBrief } from './employee.interface';
import { IDocument } from './document.interface';
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
  employeeId: string; // ref employees
  role?: string;
  commission: {
    type: 'PERCENT_OF_GROSS' | 'PERCENT_OF_NET' | 'FLAT';
    value: number; // percent (0-100) or flat amount in case currency
  };
}

export interface CaseParticipantBrief {
  employeeId: IEmployeeBrief & { _id: string };
  role?: string;
  commission: CaseParticipant['commission'];
}

export interface CaseTax {
  name: string; // e.g., VAT 10%
  mode: 'PERCENT' | 'FIXED';
  value: number; // percent (e.g., 10) or fixed amount
  scope: 'ON_BASE' | 'ON_BASE_PLUS_INCIDENTALS'; // tax base selection
}

export interface IncurredCost {
  id: string; // ObjectId as string
  date: Date | string;
  category: string; // e.g., "Lab Fee", "Shipping"
  description?: string;
  amount: number; // positive number in case currency
}

export interface InstallmentPlanItem {
  id: string;
  seq: number;
  dueDate: Date | string;
  amount: number; // planned amount
  status: InstallmentStatus;
  paidAmount: number; // derived/updated as payments apply
  notes?: string;
}

export interface ICaseServiceBrief {
  id: string;
  case_customer: ICustomerBrief;
  case_code: string;
  case_status: keyof typeof CASE_SERVICE.STATUS;
  case_startDate: string;
  case_endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICaseService extends ICaseServiceBrief {
  case_notes?: string;

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
}

export interface ICaseServiceCreate {
  customer: string;
  code: string;
  notes?: string;
  status?: keyof typeof CASE_SERVICE.STATUS;
  participants: CaseParticipant[];
  pricing: {
    baseAmount: number;
    discounts?: number;
    addOns?: number;
    taxes: CaseTax[];
  };
  installments: InstallmentPlanItem[];
  incurredCosts: IncurredCost[];
  startDate?: string | Date;
  endDate?: string | Date;
}

export interface ICaseServiceUpdate extends Partial<ICaseServiceCreate> {}

export interface ICaseServiceStatisticsQuery {
  groupBy: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface ICaseDocumentBrief {
  id: string;
  document: IDocument;
  caseService: ICaseServiceBrief;
}

export interface ICaseDocument extends ICaseDocumentBrief {
  createdBy: IEmployeeBrief;
  createdAt: string;
  updatedAt: string;
}

export interface ICaseDocumentCreate {
  caseServiceId: string;
  documentId: string;
}

// New interfaces for the additional operations

export interface IInstallmentCreate {
  seq: number;
  dueDate: Date | string;
  amount: number;
  paidAmount?: number;
  notes?: string;
}

export interface IIncurredCostCreate {
  date: Date | string;
  category: string;
  description?: string;
  amount: number;
}

export interface IParticipantCreate {
  employeeId: string;
  role?: string;
  commission: {
    type: 'PERCENT_OF_GROSS' | 'PERCENT_OF_NET' | 'FLAT';
    value: number;
    capAmount?: number;
    floorAmount?: number;
    eligibleOn: 'AT_CLOSURE' | 'ON_PAYMENT';
  };
}
