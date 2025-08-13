import { Schema, model } from 'mongoose';
import { ATTENDANCE, USER } from '../constants';
import {
  IAttendanceCreate,
  IAttendanceModel,
  IAttendanceDocument,
} from '../interfaces/attendance.interface';

const attendanceSchema = new Schema<IAttendanceDocument, IAttendanceModel>(
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
    checkInTime: Date,
    checkOutTime: Date,
  },
  {
    timestamps: true,
    collection: ATTENDANCE.COLLECTION_NAME,
  }
);

attendanceSchema.statics.build = (attrs: IAttendanceCreate) => {
  return AttendanceModel.create(attrs);
};

export const AttendanceModel = model<IAttendanceDocument, IAttendanceModel>(
  ATTENDANCE.DOCUMENT_NAME,
  attendanceSchema
);
