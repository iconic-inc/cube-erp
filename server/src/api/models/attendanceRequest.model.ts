import { Schema, model } from 'mongoose';
import { ATTENDANCE, USER } from '../constants';
import {
  IAttendanceRequestCreate,
  IAttendanceRequestModel,
  IAttendanceRequestDocument,
} from '../interfaces/attendanceRequest.interface';

const attendanceRequestSchema = new Schema<
  IAttendanceRequestDocument,
  IAttendanceRequestModel
>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: USER.EMPLOYEE.DOCUMENT_NAME,
      required: true,
    },
    fingerprint: {
      type: String,
      required: true,
    },
    ip: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    message: {
      type: String,
      default: '',
    },
    checkInTime: Date,
    checkOutTime: Date,
  },
  {
    timestamps: true,
    collection: ATTENDANCE.REQUEST.COLLECTION_NAME,
  }
);

attendanceRequestSchema.statics.build = (attrs: IAttendanceRequestCreate) => {
  return AttendanceRequestModel.create(attrs);
};

export const AttendanceRequestModel = model<
  IAttendanceRequestDocument,
  IAttendanceRequestModel
>(ATTENDANCE.REQUEST.DOCUMENT_NAME, attendanceRequestSchema);
