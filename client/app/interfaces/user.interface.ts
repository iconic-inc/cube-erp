import { USER } from '~/constants/user.constant';
import { IImage } from './image.interface';
import { IRole } from './role.interface';

export interface IUserBrief {
  id: string;
  usr_username: string;
  usr_email: string;
  usr_firstName: string;
  usr_lastName: string;
  usr_slug: string;
}

export interface IUser extends IUserBrief {
  usr_address: string;
  usr_birthdate?: string;
  usr_msisdn: string;
  usr_sex?: string;
  usr_status: Values<typeof USER.STATUS>;
  usr_avatar?: IImage;
  usr_role: IRole;
  createdAt: string;
  updatedAt: string;
}

export interface IUserCreate {
  username: string;
  email: string;
  firstName: string;
  address: string;
  msisdn: string;
  sex: string;
  role: string;
  password: string;
  status: Values<typeof USER.STATUS>;
  avatar?: string;
  lastName?: string;
  slug?: string;
  birthdate?: string;
}

export interface IUserUpdate extends Partial<IUserCreate> {}
