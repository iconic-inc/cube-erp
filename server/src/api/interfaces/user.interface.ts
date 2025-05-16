import { ClientSession, HydratedDocument, Model, Types } from 'mongoose';
import { IRole, IRoleResponseData } from './role.interface';

export interface IRawUser {
  usr_id: Types.ObjectId;
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

export interface IUser extends HydratedDocument<IRawUser> {}

export interface IUserDetail extends Omit<IUser, 'usr_role'> {
  usr_role: IRoleResponseData;
}

export interface IUserAttrs {
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
  build(attrs: IUserAttrs, session?: ClientSession): Promise<IUser>;
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
