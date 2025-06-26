import { Schema, model } from 'mongoose';
import { TASK } from '../constants';
import {
  ITaskTemplateCreate,
  ITaskTemplateDocument,
  ITaskTemplateModel,
} from '../interfaces/taskTemplate.interface';
import { formatAttributeName } from '@utils/index';

const taskTemplateSchema = new Schema<
  ITaskTemplateDocument,
  ITaskTemplateModel
>(
  {
    tpl_name: {
      type: String,
      required: true,
    },
    tpl_key: {
      type: String,
      required: true,
      unique: true,
    },
    tpl_steps: [
      {
        name: {
          type: String,
          required: true,
        },
        description: {
          type: String,
        },
        caseOrder: {
          type: Number,
          default: 0,
        },
        priority: {
          type: String,
          enum: Object.values(TASK.PRIORITY),
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
    collection: TASK.TEMPLATE.COLLECTION_NAME,
  }
);

taskTemplateSchema.statics.build = (attrs: ITaskTemplateCreate) => {
  return TaskTemplateModel.create(
    formatAttributeName(attrs, TASK.TEMPLATE.PREFIX)
  );
};

export const TaskTemplateModel = model<
  ITaskTemplateDocument,
  ITaskTemplateModel
>(TASK.TEMPLATE.DOCUMENT_NAME, taskTemplateSchema);
