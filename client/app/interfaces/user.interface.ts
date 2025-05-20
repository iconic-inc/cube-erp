import { IImage } from './image.interface';
import { IRole } from './role.interface';

export interface IUser {
  id: string;
  usr_username: string;
  usr_email: string;
  usr_firstName: string;
  usr_lastName: string;
  usr_slug: string;
  usr_address: string;
  usr_birthdate?: string;
  usr_msisdn: string;
  usr_sex?: string;
  usr_status: string;
  usr_avatar?: IImage;
  usr_role: IRole;
  createdAt: string;
  updatedAt: string;
}

export interface IUserCreate {
  username: string;
  email: string;
  firstName: string;
  lastName?: string;
  slug?: string;
  address: string;
  birthdate?: string;
  msisdn: string;
  sex: string;
  status: string;
  avatar?: string;
  role: string;
  password: string;
}
