import { HydratedDocument, Model, Types } from 'mongoose';
import { IUserCreate, IUserPopulate } from './user.interface';

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

export interface IEmployeeCreate extends IUserCreate {
  userId: string;
  code: string;
  position: string;
  department: string;
  joinDate: Date;
}

export type IEmployeeDocument = HydratedDocument<IEmployee>;

export interface IEmployeeModel extends Model<IEmployeeDocument> {
  build(attrs: IEmployeeCreate): Promise<IEmployeeDocument>;
}
