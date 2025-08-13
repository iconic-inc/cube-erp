import { HydratedDocument, Model, Types } from 'mongoose';
import { IEmployeePopulate } from './employee.interface';

export interface IAttendanceRequest {
  id: string;
  employee: Types.ObjectId;
  fingerprint: string;
  ip: string;
  date: Date;
  checkInTime?: Date;
  checkOutTime?: Date;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttendanceRequestCreate {
  employee: string | Types.ObjectId;
  fingerprint: string;
  ip: string;
  date: Date;
  message?: string;
  checkInTime?: Date;
  checkOutTime?: Date;
}

export interface ICheckInData {
  userId: string;
  fingerprint: string;
  ip: string;
  message?: string;
}

export type IAttendanceRequestDocument = HydratedDocument<IAttendanceRequest>;

export interface IAttendanceRequestModel
  extends Model<IAttendanceRequestDocument> {
  build(attrs: IAttendanceRequestCreate): Promise<IAttendanceRequestDocument>;
}

export interface IAttendanceRequestResponseData {
  id: string;
  employee: IEmployeePopulate;
  fingerprint: string;
  ip: string;
  checkInTime?: string;
  checkOutTime?: string;
  date?: string;
  message?: string;
}
