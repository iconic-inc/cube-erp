import { TASK } from '~/constants/task.constant';
import { ICaseServiceBrief } from './case.interface';
import { IEmployee } from './employee.interface';

// Task interfaces
export interface ITaskBrief {
  id: string;
  tsk_name: string;
  tsk_priority: keyof typeof TASK.PRIORITY;
  tsk_status: keyof typeof TASK.STATUS;
  tsk_startDate: string;
  tsk_endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ITask extends ITaskBrief {
  tsk_assignees: Array<IEmployee>;
  tsk_description: string;
  tsk_caseService?: ICaseServiceBrief;
  tsk_caseOrder: number;
}

export interface ITaskCreate {
  name: string;
  assignees: string[];
  description?: string;
  caseService?: string;
  caseOrder?: number;
  startDate?: Date | string;
  endDate: Date | string;
  status: keyof typeof TASK.STATUS;
  priority: keyof typeof TASK.PRIORITY;
}

export interface ITaskUpdate extends Partial<ITaskCreate> {}

export interface ITaskQuery {
  search?: string;
  assignee?: string;
  assignees?: string[];
  excludeAssignee?: string;
  status?: keyof typeof TASK.STATUS;
  statuses?: (keyof typeof TASK.STATUS)[];
  priority?: keyof typeof TASK.PRIORITY;
  priorities?: (keyof typeof TASK.PRIORITY)[];
  createdBy?: string;
  isOverdue?: boolean;
  isDueSoon?: boolean;
  isCompleted?: boolean;
  caseService?: string;
  startDateFrom?: string | Date;
  startDateTo?: string | Date;
  endDateFrom?: string | Date;
  endDateTo?: string | Date;
  createdAtFrom?: string | Date;
  createdAtTo?: string | Date;
}
