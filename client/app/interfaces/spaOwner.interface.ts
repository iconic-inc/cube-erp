import { ISpa } from './spa.interface';
import { IUser, IUserCreate } from './user.interface';

export interface ISpaOwnerCreate extends IUserCreate {
  spas?: string[];
  level?: 'owner' | 'manager';
  plan?: string;
  planExpireAt?: Date;
  status: 'active' | 'suspended';
}

export interface ISpaOwner {
  id: string;
  spo_user: Pick<
    IUser,
    | 'id'
    | 'usr_email'
    | 'usr_firstName'
    | 'usr_lastName'
    | 'usr_msisdn'
    | 'usr_address'
    | 'usr_birthdate'
  >; // User ID
  spo_level: string; // Level ID
  spo_spas: Pick<
    ISpa,
    'sp_name' | 'sp_slug' | 'sp_status' | 'sp_averageRating' | 'sp_reviewCount'
  >[]; // Spa IDs
  spo_plan: string; // Plan ID
  spo_status: 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface ISpaOwnerDetails extends ISpaOwner {
  spo_user: ISpaOwner['spo_user'] & Pick<IUser, 'usr_sex' | 'usr_username'>;
}
