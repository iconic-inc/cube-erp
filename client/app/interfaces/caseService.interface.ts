import { ICustomerBrief } from './customer.interface';
import { IEmployeeBrief } from './employee.interface';

export interface ICaseServiceBrief {
  id: string;
  case_customer: ICustomerBrief;
  case_code: string;
  case_leadAttorney: IEmployeeBrief;
  case_status: string;
  case_startDate: string;
  case_endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICaseService extends ICaseServiceBrief {
  case_notes?: string;
  case_associateAttorney?: IEmployeeBrief;
  case_paralegal?: IEmployeeBrief;
}

export interface ICaseServiceCreate {
  customer: string;
  code: string;
  leadAttorney: string;
  associateAttorney?: string;
  paralegal?: string;
  notes?: string;
  status?: string;
  startDate?: string | Date;
  endDate?: string | Date;
}
