import { Schema, model, models } from 'mongoose';

import {
  IOTPDocument,
  IOTPCreate,
  IOTPModel,
  IOTP,
} from '../interfaces/otp.interface';
import { OTP } from '../constants';
import { formatAttributeName } from '@utils/index';

const otpSchema = new Schema<IOTPDocument, IOTPModel>(
  {
    otp_token: {
      type: String,
      required: true,
    },
    otp_email: {
      type: String,
      required: true,
    },
    otp_status: {
      type: String,
      enum: Object.values(OTP.STATUS),
      default: OTP.STATUS.ACTIVE,
    },
    expireAt: {
      type: Date,
      default: Date.now,
      expires: 60,
    },
  },
  {
    timestamps: true,
    collection: OTP.COLLECTION_NAME,
  }
);

otpSchema.statics.build = async (attrs: IOTPCreate) => {
  return OTPModel.create(formatAttributeName(attrs, OTP.PREFIX));
};

export const OTPModel =
  // models[OTP.DOCUMENT_NAME] ||
  model<IOTPDocument, IOTPModel>(OTP.COLLECTION_NAME, otpSchema);
