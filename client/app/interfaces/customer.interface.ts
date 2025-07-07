import { CUSTOMER } from '~/constants/customer.constant';

export interface ICustomerBrief {
  id: string;
  cus_firstName: string;
  cus_lastName: string;
  cus_email: string;
  cus_msisdn: string;
  cus_code: string;
}

export interface ICustomer extends ICustomerBrief {
  cus_email: string;
  cus_msisdn: string;
  cus_address?: string;
  cus_birthDate?: string;
  cus_sex?: Values<typeof CUSTOMER.SEX>;
  cus_contactChannel?: string;
  cus_source?: string;
  cus_notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICustomerCreate {
  code: string;
  firstName: string;
  lastName?: string;
  email: string;
  msisdn: string;
  address?: string;
  birthDate?: string;
  sex?: Values<typeof CUSTOMER.SEX>;
  contactChannel?: string;
  source?: string;
  notes?: string;
}

export interface IUpdateCustomerData extends Partial<ICustomerCreate> {}

export interface ICustomerStatisticsQuery {
  groupBy: 'status' | 'contactChannel' | 'source' | 'monthly' | 'daily';
  dateRange?: {
    start: string;
    end: string;
  };
}
