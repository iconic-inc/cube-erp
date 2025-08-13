import { TASK } from '@/api/constants';
import { HydratedDocument, Model, Types } from 'mongoose';
import { ITaskCreate, ITaskUpdate } from './task.interface';

export interface ITaskTemplatePopulate {
  id: string;
  tpl_name: string;
  tpl_key: string;
}

export interface ITaskTemplate extends ITaskTemplatePopulate {
  tpl_steps: Array<ITaskCreate & { caseOrder: number }>;
}

export interface ITaskTemplateDetail extends ITaskTemplatePopulate {
  tpl_steps: Array<ITaskCreate & { caseOrder: number }>;
}

export interface ITaskTemplateCreate {
  name: string;
  key: string;
  steps: Array<
    Required<
      Pick<ITaskCreate, 'name' | 'description' | 'caseOrder' | 'priority'>
    >
  >;
}

export interface ITaskTemplateUpdate extends Partial<ITaskTemplateCreate> {}

export type ITaskTemplateDocument = HydratedDocument<ITaskTemplate>;

export interface ITaskTemplateModel extends Model<ITaskTemplateDocument> {
  build(attrs: ITaskTemplateCreate): Promise<ITaskTemplateDocument>;
}
