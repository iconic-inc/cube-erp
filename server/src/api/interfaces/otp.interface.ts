import { HydratedDocument, Model, ObjectId } from 'mongoose';
import { OTP } from '../constants/otp.constant';

export interface IOTP {
  otp_token: string;
  otp_email: string;
  otp_status: Values<typeof OTP.STATUS>;
  expireAt: Date;
}

export type IOTPDocument = HydratedDocument<IOTP>;

export interface IOTPCreate {
  token: string;
  email: string;
}

export interface IOTPModel extends Model<IOTPDocument> {
  build(attrs: IOTPCreate): Promise<IOTPDocument>;
}
