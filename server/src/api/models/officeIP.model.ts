import { Schema, model } from 'mongoose';
import {
  IOfficeIP,
  IOfficeIPCreate,
  IOfficeIPDocument,
  IOfficeIPModel,
} from '../interfaces/officeIP.interface';
import { OFFICE_IP } from '../constants/officeIP.constant';

const officeIPSchema = new Schema<IOfficeIPDocument, IOfficeIPModel>(
  {
    officeName: {
      type: String,
      unique: true,
      required: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: OFFICE_IP.COLLECTION_NAME,
  }
);

officeIPSchema.statics.build = async (attrs: IOfficeIPCreate) => {
  return OfficeIPModel.create(attrs);
};

export const OfficeIPModel = model<IOfficeIPDocument, IOfficeIPModel>(
  OFFICE_IP.DOCUMENT_NAME,
  officeIPSchema
);
