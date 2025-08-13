import { IRole } from './role.interface';

export interface ISessionUser {
  user: {
    id: string;
    usr_email: string;
    usr_role: IRole;
  };
  tokens: { accessToken: string; refreshToken: string };
}
