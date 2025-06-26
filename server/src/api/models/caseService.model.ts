import { Schema, model } from 'mongoose';
import { CASE_SERVICE, CUSTOMER, USER } from '../constants';
import {
  ICaseServiceCreate,
  ICaseServiceModel,
  ICaseServiceDocument,
} from '../interfaces/caseService.interface';
import { formatAttributeName } from '../utils';

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
    case_leadAttorney: {
      type: Schema.Types.ObjectId,
      ref: USER.EMPLOYEE.DOCUMENT_NAME,
      required: true,
    },
    case_assignees: {
      type: [Schema.Types.ObjectId],
      ref: USER.EMPLOYEE.DOCUMENT_NAME,
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

export const CaseServiceModel = model<ICaseServiceDocument, ICaseServiceModel>(
  CASE_SERVICE.DOCUMENT_NAME,
  caseServiceSchema
);
