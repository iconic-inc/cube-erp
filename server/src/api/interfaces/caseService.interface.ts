import { HydratedDocument, Model, Types } from 'mongoose';
import { CASE_SERVICE } from '../constants';
import { ICustomerPopulate } from './customer.interface';
import { IEmployeePopulate } from './employee.interface';

export interface ICaseServicePopulate {
  id: string;
  case_customer: ICustomerPopulate;
  case_code: string;
  case_leadAttorney: IEmployeePopulate;
  case_assignees?: IEmployeePopulate[];
  case_status: Values<typeof CASE_SERVICE.STATUS>;
  case_startDate: Date;
  case_endDate?: Date;
}

export interface ICaseService {
  id: string;
  case_customer: Types.ObjectId;
  case_code: string;
  case_leadAttorney: Types.ObjectId;
  case_assignees?: Types.ObjectId[];
  case_notes?: string;
  case_status: Values<typeof CASE_SERVICE.STATUS>;
  case_startDate: Date;
  case_endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICaseServiceCreate {
  customer: string;
  leadAttorney: string;
  assignees?: string[];
  code: ICaseService['case_code'];
  notes?: ICaseService['case_notes'];
  status?: ICaseService['case_status'];
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
    Omit<
      ICaseService,
      'case_customer' | 'case_leadAttorney' | 'case_assignees'
    > {}

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
  leadAttorneyId?: string;
}
