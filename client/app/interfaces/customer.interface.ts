import { CUSTOMER } from '~/constants/customer.constant';

export interface ICustomerBrief {
  id: string;
  cus_fullName: string;
  cus_lastName: string;
  cus_email: string;
  cus_msisdn: string;
  cus_address?: string;
  cus_sex: Values<typeof CUSTOMER.SEX>;
}

export interface ICustomer extends ICustomerBrief {
  cus_status: Values<typeof CUSTOMER.STATUS>;
  cus_contactChannel: string;
  cus_source: string;
  cus_dateOfBirth?: string;
  cus_notes?: string;
}

export interface ICustomerCreate {
  firstName: string;
  lastName?: string;
  email: string;
  msisdn: string;
  address?: string;
  dateOfBirth?: string;
  sex?: Values<typeof CUSTOMER.SEX>;
  contactChannel?: string;
  source?: string;
  notes?: string;
}

export interface IUpdateCustomerData extends Partial<ICustomerCreate> {}
