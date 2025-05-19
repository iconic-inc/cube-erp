import { Schema, model } from 'mongoose';
import { CUSTOMER } from '../constants';
import {
  ICustomerCreate,
  ICustomerDocument,
  ICustomerModel,
} from '../interfaces/customer.interface';
import { formatAttributeName } from '../utils';

const customerSchema = new Schema<ICustomerDocument, ICustomerModel>(
  {
    cus_fistName: {
      type: String,
      trim: true,
      required: true,
    },
    cus_lastName: {
      type: String,
      trim: true,
    },
    cus_email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
    cus_msisdn: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
    cus_address: {
      type: String,
      trim: true,
    },
    cus_sex: {
      type: String,
      enum: Object.values(CUSTOMER.SEX),
      default: CUSTOMER.SEX.MALE,
    },
    cus_contactChannel: {
      type: String,
      default: 'Facebook',
    },
    cus_source: {
      type: String,
      default: 'Facebook',
    },
    cus_notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: CUSTOMER.COLLECTION_NAME,
  }
);

customerSchema.statics.build = (attrs: ICustomerCreate) => {
  return CustomerModel.create(formatAttributeName(attrs, CUSTOMER.PREFIX));
};

export const CustomerModel = model<ICustomerDocument, ICustomerModel>(
  CUSTOMER.DOCUMENT_NAME,
  customerSchema
);
