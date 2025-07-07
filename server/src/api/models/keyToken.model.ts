import { Schema, model, models } from 'mongoose';

import { KEYTOKEN } from '../constants';
import {
  IKeyTokenCreate,
  IKeyTokenDocument,
  IKeyTokenModel,
} from '../interfaces/keyToken.interface';
import { UserModel } from './user.model';

const keyTokenSchema = new Schema<IKeyTokenDocument, IKeyTokenModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      trim: true,
      ref: UserModel,
    },
    browserId: {
      type: String,
      trim: true,
      required: true,
    },
    publicKey: {
      type: String,
      trim: true,
      required: true,
    },
    privateKey: {
      type: String,
      trim: true,
      required: true,
    },
    refreshTokensUsed: {
      type: [String],
      default: [],
    },
    refreshToken: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: KEYTOKEN.COLLECTION_NAME,
  }
);

keyTokenSchema.statics.build = async (attrs: IKeyTokenCreate) => {
  return KeyTokenModel.create(attrs);
};

export const KeyTokenModel =
  // models[KEYTOKEN.DOCUMENT_NAME] ||
  model<IKeyTokenDocument, IKeyTokenModel>(
    KEYTOKEN.DOCUMENT_NAME,
    keyTokenSchema
  );
