// filepath: /home/phanhotboy/workspace/iconic/cube-erp/server/src/api/models/task.model.ts
import { Schema, model } from 'mongoose';
import { CASE_SERVICE, DOCUMENT, TASK, USER } from '../constants';
import {
  ITaskCreate,
  ITaskDocument,
  ITaskModel,
} from '../interfaces/task.interface';
import { formatAttributeName } from '@utils/index';

const taskSchema = new Schema<ITaskDocument, ITaskModel>(
  {
    tsk_assignees: {
      type: [Schema.Types.ObjectId],
      ref: USER.EMPLOYEE.DOCUMENT_NAME,
      required: true,
    },
    tsk_name: {
      type: String,
      required: true,
    },
    tsk_description: {
      type: String,
    },
    tsk_caseService: {
      type: Schema.Types.ObjectId,
      ref: CASE_SERVICE.DOCUMENT_NAME,
    },
    tsk_caseOrder: {
      type: Number,
      default: 0,
    },
    tsk_startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    tsk_endDate: {
      type: Date,
      required: true,
    },
    tsk_priority: {
      type: String,
      enum: Object.values(TASK.PRIORITY),
      required: true,
    },
    tsk_status: {
      type: String,
      enum: Object.values(TASK.STATUS),
      required: true,
      default: TASK.STATUS.NOT_STARTED,
    },
  },
  {
    timestamps: true,
    collection: TASK.COLLECTION_NAME,
  }
);

taskSchema.statics.build = (attrs: ITaskCreate) => {
  return TaskModel.create(formatAttributeName(attrs, TASK.PREFIX));
};

export const TaskModel = model<ITaskDocument, ITaskModel>(
  TASK.DOCUMENT_NAME,
  taskSchema
);
