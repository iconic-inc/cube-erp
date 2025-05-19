import { Schema, model, models } from 'mongoose';

import { APIKEY } from '../constants';
import {
  IApiKeyCreate,
  IApiKeyDocument,
  IApiKeyModel,
} from '../interfaces/apiKey.interface';

const apiKeySchema = new Schema<IApiKeyDocument, IApiKeyModel>(
  {
    key: {
      type: String,
      unique: true,
      required: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
    permissions: {
      type: [String],
      required: true,
      enum: ['0000', '1111', '2222'],
    },
  },
  {
    timestamps: true,
    collection: APIKEY.COLLECTION_NAME,
  }
);

apiKeySchema.statics.build = async (attrs: IApiKeyCreate) => {
  return ApiKeyModel.create(attrs);
};

export const ApiKeyModel = model<IApiKeyDocument, IApiKeyModel>(
  APIKEY.DOCUMENT_NAME,
  apiKeySchema
);
