import { CUSTOMER } from '@constants/customer.constant';
import { HydratedDocument, Model, Types } from 'mongoose';

export interface ICustomerPopulate {
  id: string;
  cus_fistName: string;
  cus_lastName: string;
}

export interface ICustomer extends ICustomerPopulate {
  cus_email: string;
  cus_msisdn: string;
  cus_address?: string;
  cus_sex?: Values<typeof CUSTOMER.SEX>;
  cus_contactChannel?: string;
  cus_source?: string;
  cus_notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICustomerDocument extends HydratedDocument<ICustomer> {}

export interface ICustomerModel extends Model<ICustomerDocument> {
  build(attrs: ICustomer): Promise<ICustomerDocument>;
}

export interface ICustomerCreate {
  firstName: string;
  lastName?: string;
  email: string;
  msisdn: string;
  address?: string;
  sex?: Values<typeof CUSTOMER.SEX>;
  contactChannel?: string;
  source?: string;
  notes?: string;
}

export interface ICustomerUpdate extends Partial<ICustomerCreate> {}
