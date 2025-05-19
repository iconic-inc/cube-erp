import { model, Schema, Types, Model, ClientSession, models } from 'mongoose';
import { IMAGE, ROLE, USER } from '../constants';
import {
  IUser,
  IUserCreate,
  IUserDocument,
  IUserModel,
} from '../interfaces/user.interface';
import { formatAttributeName } from '@utils/index';

const userSchema = new Schema<IUserDocument, IUserModel>(
  {
    usr_username: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    usr_email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    usr_firstName: {
      type: String,
      required: true,
      trim: true,
    },
    usr_lastName: {
      type: String,
      trim: true,
    },
    usr_slug: {
      type: String,
      required: true,
    },
    usr_password: {
      type: String,
      required: true,
    },
    usr_salt: {
      type: String,
      required: true,
    },
    usr_avatar: {
      type: Types.ObjectId,
      ref: IMAGE.DOCUMENT_NAME,
    },
    usr_address: {
      type: String,
    },
    usr_birthdate: {
      type: Date,
    },
    usr_msisdn: {
      type: String,
    },
    usr_sex: {
      type: String,
    },
    usr_status: {
      type: String,
      default: 'active',
      enum: ['active', 'inactive'],
    },
    usr_role: {
      type: Schema.Types.ObjectId,
      ref: ROLE.DOCUMENT_NAME,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: USER.COLLECTION_NAME,
  }
);

userSchema.statics.build = async (attrs: IUserCreate) => {
  return await UserModel.create(formatAttributeName(attrs, USER.PREFIX));
};

export const UserModel =
  // models[USER.DOCUMENT_NAME] ||
  model<IUserDocument, IUserModel>(USER.DOCUMENT_NAME, userSchema);
