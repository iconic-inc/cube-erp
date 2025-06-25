import { CASE_SERVICE } from '~/constants/caseService.constant';
import { ICustomerBrief } from './customer.interface';
import { IEmployeeBrief } from './employee.interface';
import { IDocument } from './document.interface';

export interface ICaseServiceBrief {
  id: string;
  case_customer: ICustomerBrief;
  case_code: string;
  case_leadAttorney: IEmployeeBrief;
  case_status: keyof typeof CASE_SERVICE.STATUS;
  case_startDate: string;
  case_endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICaseService extends ICaseServiceBrief {
  case_notes?: string;
  case_assignees?: IEmployeeBrief[];
}

export interface ICaseServiceCreate {
  customer: string;
  code: string;
  leadAttorney: string;
  assignees?: string[];
  notes?: string;
  status?: keyof typeof CASE_SERVICE.STATUS;
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
