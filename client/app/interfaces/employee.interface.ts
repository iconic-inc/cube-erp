import { IUser, IUserBrief, IUserCreate } from './user.interface';

export interface IEmployeeBrief {
  id: string;
  emp_code: string;
  emp_position: string;
  emp_department: string;
  emp_joinDate: string;
  createdAt: string;
  updatedAt: string;
  emp_user: IUserBrief;
}

export interface IEmployee extends IEmployeeBrief {
  emp_user: IUser;
}

export interface IEmployeeCreate extends IUserCreate {
  code: string;
  position: string;
  department: string;
  joinDate: Date | string;
}

export interface IEmployeeUpdate extends Partial<IEmployeeCreate> {}
