import { Schema, model } from 'mongoose';
import { CASE_SERVICE, CUSTOMER, TRANSACTION, USER } from '../constants';
import {
  ICaseServiceCreate,
  ICaseServiceModel,
  ICaseServiceDocument,
  CaseTax,
  CaseParticipant,
  InstallmentPlanItem,
  IncurredCost,
} from '../interfaces/caseService.interface';
import { formatAttributeName } from '../utils';
import { TaskModel } from './task.model';
import { DocumentCaseModel } from './documentCase.model';

const CaseTaxSchema = new Schema<CaseTax>(
  {
    name: { type: String, required: true },
    mode: { type: String, enum: ['PERCENT', 'FIXED'], required: true },
    value: { type: Number, required: true, min: 0 },
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: TRANSACTION.DOCUMENT_NAME,
    },
  },
  { _id: false }
);

const ParticipantSchema = new Schema<CaseParticipant>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: USER.EMPLOYEE.DOCUMENT_NAME,
      index: true,
    },
    role: String,
    commission: {
      type: {
        type: String,
        enum: ['PERCENT_OF_GROSS', 'PERCENT_OF_NET', 'FLAT'],
        required: true,
      },
      value: { type: Number, required: true, min: 0 },
      transactionId: {
        type: Schema.Types.ObjectId,
        ref: TRANSACTION.DOCUMENT_NAME,
      },
    },
  },
  { _id: false }
);

const InstallmentSchema = new Schema<InstallmentPlanItem>(
  {
    seq: { type: Number, required: true },
    dueDate: { type: Date, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['PLANNED', 'DUE', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'],
      default: 'PLANNED',
      index: true,
    },
    paidAmount: { type: Number, default: 0, min: 0 },
    notes: String,
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: TRANSACTION.DOCUMENT_NAME,
    },
  },
  { _id: true }
);

const IncurredCostSchema = new Schema<IncurredCost>(
  {
    date: { type: Date, required: true, index: true },
    category: { type: String, required: true },
    description: String,
    amount: { type: Number, required: true, min: 0 },
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: TRANSACTION.DOCUMENT_NAME,
    },
  },
  { _id: true }
);

const caseServiceSchema = new Schema<ICaseServiceDocument, ICaseServiceModel>(
  {
    case_customer: {
      type: Schema.Types.ObjectId,
      ref: CUSTOMER.DOCUMENT_NAME,
      required: true,
    },
    case_code: {
      type: String,
      required: true,
      unique: true,
    },
    case_notes: {
      type: String,
    },
    case_status: {
      type: String,
      enum: Object.values(CASE_SERVICE.STATUS),
      default: CASE_SERVICE.STATUS.OPEN,
    },
    case_startDate: {
      type: Date,
      default: Date.now,
    },
    case_endDate: {
      type: Date,
    },

    case_pricing: {
      baseAmount: { type: Number, required: true, min: 0 },
      discounts: { type: Number, default: 0 }, // negative allowed if you prefer
      addOns: { type: Number, default: 0 },
      taxes: { type: [CaseTaxSchema], default: [] },
    },

    case_participants: { type: [ParticipantSchema], default: [] },

    case_installments: { type: [InstallmentSchema], default: [] },

    case_incurredCosts: { type: [IncurredCostSchema], default: [] },

    // commissionSettlements: { type: [CommissionSettlementSchema], default: [] },

    case_totalsCache: {
      scheduled: { type: Number, default: 0 },
      paid: { type: Number, default: 0 },
      taxComputed: { type: Number, default: 0 },
      incurredCostTotal: { type: Number, default: 0 },
      commissionTotal: { type: Number, default: 0 },
      netFinal: { type: Number, default: 0 },
      nextDueDate: { type: Date, default: null },
      overdueCount: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    collection: CASE_SERVICE.COLLECTION_NAME,
  }
);

caseServiceSchema.statics.build = (attrs: ICaseServiceCreate) => {
  return CaseServiceModel.create(
    formatAttributeName(attrs, CASE_SERVICE.PREFIX)
  );
};

const cascadeDelete = async (caseServiceId: string) => {
  await TaskModel.deleteMany({
    tsk_caseService: caseServiceId,
  });
  await DocumentCaseModel.deleteMany({
    caseService: caseServiceId,
  });
};

caseServiceSchema.pre('findOneAndDelete', async function (next) {
  await cascadeDelete(this.getFilter()._id as string);
  next();
});
caseServiceSchema.pre('deleteOne', async function (next) {
  await cascadeDelete(this.getFilter()._id as string);
  next();
});
caseServiceSchema.pre('deleteMany', async function (next) {
  await cascadeDelete(this.getFilter()._id as string);
  next();
});

export const CaseServiceModel = model<ICaseServiceDocument, ICaseServiceModel>(
  CASE_SERVICE.DOCUMENT_NAME,
  caseServiceSchema
);
