import { HydratedDocument, Model, Types } from 'mongoose';
import { IEmployeePopulate } from './employee.interface';

export interface IAttendance {
  id: string;
  employee: Types.ObjectId;
  fingerprint: string;
  ip: string;
  date: Date;
  checkInTime?: Date;
  checkOutTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttendanceCreate {
  employee: string | Types.ObjectId;
  fingerprint: string;
  ip: string;
  date: Date;
  checkInTime?: Date;
  checkOutTime?: Date;
}

export interface ICheckInData {
  userId: string;
  fingerprint: string;
  ip: string;
}

export interface IAttendanceStats {
  id: Types.ObjectId;
  totalDays: number;
  lateCount: number;
}

export type IAttendanceDocument = HydratedDocument<IAttendance>;

export interface IAttendanceModel extends Model<IAttendanceDocument> {
  build(attrs: IAttendanceCreate): Promise<IAttendanceDocument>;
}

export interface IAttendanceResponseData {
  id: string;
  employee: IEmployeePopulate;
  fingerprint: string;
  ip: string;
  checkInTime: Date;
  scheduledTime?: Date;
}

export interface IAttendanceQRResponse {
  qrCode: string;
  attendanceUrl: string;
}
