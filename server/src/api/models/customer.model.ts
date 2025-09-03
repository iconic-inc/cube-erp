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
    cus_code: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
    cus_firstName: {
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
      unique: true,
      sparse: true, // Only apply unique constraint to non-null values
    },
    cus_msisdn: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
    cus_address: {
      provinceId: { type: String },
      wardId: { type: String },
      street: { type: String, required: true },
    },
    cus_sex: {
      type: String,
      enum: Object.values(CUSTOMER.SEX).flatMap((item) => item.value),
      default: CUSTOMER.SEX.MALE.value,
    },
    cus_birthDate: {
      type: Date,
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
    cus_createdAt: {
      type: Date,
      default: Date.now,
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
