import { TASK } from '@/api/constants';
import { HydratedDocument, Model, Types } from 'mongoose';
import { IEmployeePopulate } from './employee.interface';
import { ICaseServicePopulate } from './caseService.interface';

export interface ITaskPopulate {
  id: string;
  tsk_name: string;
  tsk_assignees: Array<IEmployeePopulate>;
  tsk_priority: Values<typeof TASK.PRIORITY>;
  tsk_startDate: Date | string;
  tsk_endDate: Date | string;
  tsk_status: Values<typeof TASK.STATUS>;
  updatedAt: string;
  createdAt: string;
}

export interface ITask extends Omit<ITaskPopulate, 'tsk_assignees'> {
  tsk_assignees: Array<Types.ObjectId>;
  tsk_caseService?: ICaseServicePopulate;
  tsk_caseOrder?: number;
  tsk_description: string;
}

export interface ITaskDetail extends ITaskPopulate {
  tsk_description?: string;
  tsk_caseService?: ICaseServicePopulate;
  tsk_caseOrder?: number;
}

export interface ITaskCreate {
  assignees: string[];
  name: string;

  caseService?: string;
  caseOrder?: number;

  description?: string;
  startDate?: Date | string;
  endDate: Date | string;
  status: Values<typeof TASK.STATUS>;
  priority: Values<typeof TASK.PRIORITY>;
}

export interface ITaskUpdate extends Partial<ITaskCreate> {}

export type ITaskDocument = HydratedDocument<ITask>;

export interface ITaskModel extends Model<ITaskDocument> {
  build(attrs: ITaskCreate): Promise<ITaskDocument>;
}
