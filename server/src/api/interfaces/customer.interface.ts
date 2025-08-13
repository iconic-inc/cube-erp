import { CUSTOMER } from '@constants/customer.constant';
import { HydratedDocument, Model, Types } from 'mongoose';

type IAddress = {
  province?: string;
  district?: string;
  street: string;
};

export interface ICustomerPopulate {
  id: string;
  cus_firstName: string;
  cus_lastName: string;
  cus_code: string;
  cus_createdAt: Date;
}

export interface ICustomer extends ICustomerPopulate {
  cus_email?: string;
  cus_msisdn: string;
  cus_address?: IAddress;
  cus_birthDate?: string;
  cus_sex?: Values<typeof CUSTOMER.SEX>['value'];
  cus_contactChannel?: string;
  cus_source?: string;
  cus_notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICustomerDocument extends HydratedDocument<ICustomer> {}

export interface ICustomerModel extends Model<ICustomerDocument> {
  build(attrs: ICustomerCreate): Promise<ICustomerDocument>;
}

export interface ICustomerCreate extends Partial<IAddress> {
  code: string;
  firstName: string;
  lastName?: string;
  email?: string;
  msisdn: string;
  address: IAddress;
  birthDate?: string;
  sex?: Values<typeof CUSTOMER.SEX>['value'];
  contactChannel?: string;
  source?: string;
  notes?: string;
  createdAt?: string;
}

export interface ICustomerUpdate extends Partial<ICustomerCreate> {}
