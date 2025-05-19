import { ClientSession, HydratedDocument, Model, Types } from 'mongoose';
import { IRole, IRoleResponseData } from './role.interface';

export interface IUserPopulate {
  id: string;
  usr_fistName: string;
  usr_lastName: string;
  usr_slug: string;
}

export interface IUser {
  id: Types.ObjectId;
  usr_username: string;
  usr_email: string;
  usr_firstName: string;
  usr_lastName: string;
  usr_slug: string;
  usr_password: string;
  usr_salt: string;
  usr_avatar?: string;
  usr_address?: string;
  usr_birthdate?: Date;
  usr_msisdn?: string;
  usr_sex?: string;
  usr_status: 'active' | 'inactive';
  usr_role: Types.ObjectId;
}

export interface IUserDocument extends HydratedDocument<IUser> {}

export interface IUserDetail extends Omit<IUser, 'usr_role'> {
  usr_role: IRoleResponseData;
}

export interface IUserCreate {
  id?: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  slug: string;
  password?: string;
  salt?: string;
  avatar?: string;
  address?: string;
  birthdate?: Date;
  msisdn?: string;
  sex?: string;
  status: 'active' | 'inactive';
  role: Types.ObjectId;
}

export interface IUserModel extends Model<IUser> {
  build(attrs: IUserCreate): Promise<IUserDocument>;
}

export interface IUserJWTPayload {
  userId: string;
  email: string;
  browserId: string;
}

export interface IUserResponseData {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  slug: string;
  avatar?: string;
  address?: string;
  birthdate?: Date;
  msisdn?: string;
  sex?: string;
  status: string;
  role: IRole;
}
