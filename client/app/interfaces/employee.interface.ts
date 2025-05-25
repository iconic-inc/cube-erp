import { IUser, IUserBrief, IUserCreate } from './user.interface';

export interface IEmployeeBrief {
  id: string;
  employeeCode: string;
  position: string;
  department: string;
  joinDate: string;
  createdAt: string;
  updatedAt: string;
  user: IUserBrief;
}

export interface IEmployee extends IEmployeeBrief {
  user: IUser;
}

export interface IEmployeeCreate extends IUserCreate {
  employeeCode: string;
  position: string;
  department: string;
  joinDate: string;
}

export interface IEmployeeUpdate extends Partial<IEmployeeCreate> {}
