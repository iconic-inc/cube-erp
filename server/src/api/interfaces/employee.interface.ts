import { HydratedDocument, Model, Types } from 'mongoose';
import { IUserCreate, IUserDetail, IUserPopulate } from './user.interface';

export interface IEmployeePopulate {
  id: string;
  emp_user: IUserPopulate;
  emp_code: string;
  emp_position: string;
  emp_department: string;
}

export interface IEmployee extends Omit<IEmployeePopulate, 'emp_user'> {
  id: string;
  emp_user: Types.ObjectId;
  emp_code: string;
  emp_position: string;
  emp_department: string;
  emp_joinDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEmployeeDetail extends IEmployeePopulate {
  emp_user: IUserDetail;
  emp_joinDate: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IEmployeeCreate extends IUserCreate {
  code: string;
  position: string;
  department: string;
  joinDate: Date | string;
}

export type IEmployeeDocument = HydratedDocument<IEmployee>;

export interface IEmployeeModel extends Model<IEmployeeDocument> {
  build(attrs: IEmployeeCreate): Promise<IEmployeeDocument>;
}
