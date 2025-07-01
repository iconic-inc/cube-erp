import { Schema, model } from 'mongoose';

import { TRANSACTION } from '../constants/transaction.constant';
import { CUSTOMER } from '../constants/customer.constant';
import { USER } from '../constants/user.constant';
import { CASE_SERVICE } from '../constants/caseService.constant';
import {
  ITransactionCreate,
  ITransactionModel,
  ITransactionDocument,
} from '../interfaces/transaction.interface';
import { formatAttributeName } from '../utils';

const transactionSchema = new Schema<ITransactionDocument, ITransactionModel>(
  {
    tx_code: {
      type: String,
      required: true,
      unique: true,
    },
    tx_type: {
      type: String,
      enum: Object.values(TRANSACTION.TYPE),
      required: true,
    },
    tx_title: {
      type: String,
      required: true,
    },
    tx_amount: {
      type: Number,
      required: true,
      min: 0,
    },
    tx_paid: {
      type: Number,
      default: 0,
      min: 0,
    },
    tx_paymentMethod: {
      type: String,
      enum: Object.values(TRANSACTION.PAYMENT_METHOD),
      required: true,
    },
    tx_category: {
      type: String,
      enum: [
        ...Object.values(TRANSACTION.CATEGORY.INCOME),
        ...Object.values(TRANSACTION.CATEGORY.OUTCOME),
      ],
      required: true,
    },
    tx_description: {
      type: String,
    },
    tx_createdBy: {
      type: Schema.Types.ObjectId,
      ref: USER.EMPLOYEE.DOCUMENT_NAME,
      required: true,
    },
    tx_customer: {
      type: Schema.Types.ObjectId,
      ref: CUSTOMER.DOCUMENT_NAME,
    },
    tx_caseService: {
      type: Schema.Types.ObjectId,
      ref: CASE_SERVICE.DOCUMENT_NAME,
    },
    tx_date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: TRANSACTION.COLLECTION_NAME,
  }
);

// Add indexes for better query performance
transactionSchema.index({ tx_type: 1 });
transactionSchema.index({ tx_category: 1 });
transactionSchema.index({ tx_createdBy: 1 });
transactionSchema.index({ tx_customer: 1 });
transactionSchema.index({ tx_caseService: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ tx_amount: 1 });

transactionSchema.statics.build = (attrs: ITransactionCreate) => {
  return TransactionModel.create(
    formatAttributeName(attrs, TRANSACTION.PREFIX)
  );
};

export const TransactionModel = model<ITransactionDocument, ITransactionModel>(
  TRANSACTION.DOCUMENT_NAME,
  transactionSchema
);
