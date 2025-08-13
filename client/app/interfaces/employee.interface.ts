import { IUser, IUserBrief, IUserCreate } from './user.interface';

export interface IEmployeeBrief {
  id: string;
  emp_code: string;
  emp_position: string;
  emp_department: string;
  emp_joinDate: string;
  emp_score: number;
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
  score?: number;
}

export interface IEmployeeUpdate extends Partial<IEmployeeCreate> {}
