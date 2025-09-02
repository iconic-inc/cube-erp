import { Schema, model, Types, Model } from 'mongoose';
import { USER } from '../constants';
import {
  IEmployeeCreate,
  IEmployeeDocument,
  IEmployeeModel,
} from '../interfaces/employee.interface';
import { formatAttributeName } from '@utils/index';

const employeeSchema = new Schema<IEmployeeDocument, IEmployeeModel>(
  {
    emp_user: {
      type: Schema.Types.ObjectId,
      ref: USER.DOCUMENT_NAME,
      required: true,
    },
    emp_code: {
      type: String,
      required: true,
      unique: true,
    },
    emp_position: {
      type: String,
      required: true,
    },
    emp_department: {
      type: String,
      required: true,
    },
    emp_joinDate: {
      type: Date,
      required: true,
    },
    emp_score: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: USER.EMPLOYEE.COLLECTION_NAME,
  }
);

employeeSchema.statics.build = (attrs: IEmployeeCreate) => {
  return EmployeeModel.create(formatAttributeName(attrs, USER.EMPLOYEE.PREFIX));
};

employeeSchema.pre('findOneAndDelete', async function (next) {
  // Note: Participants are now embedded in CaseServiceModel, so no cascade delete needed
  next();
});
employeeSchema.pre('deleteOne', async function (next) {
  // Note: Participants are now embedded in CaseServiceModel, so no cascade delete needed
  next();
});
employeeSchema.pre('deleteMany', async function (next) {
  // Note: Participants are now embedded in CaseServiceModel, so no cascade delete needed
  next();
});

export const EmployeeModel = model<IEmployeeDocument, IEmployeeModel>(
  USER.EMPLOYEE.DOCUMENT_NAME,
  employeeSchema
);
