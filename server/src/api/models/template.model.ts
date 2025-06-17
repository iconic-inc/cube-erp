import { Schema, model, models } from 'mongoose';

import {
  ITemplate,
  ITemplateCreate,
  ITemplateDocument,
  ITemplateModel,
} from '../interfaces/template.interface';
import { TEMPLATE } from '../constants';
import { formatAttributeName } from '@utils/index';

const templateSchema = new Schema<ITemplateDocument, ITemplateModel>(
  {
    tem_name: {
      type: String,
      required: true,
      unique: true,
    },
    tem_html: {
      type: String,
      required: true,
    },
    tem_status: {
      type: String,
      enum: Object.values(TEMPLATE.STATUS),
      default: TEMPLATE.STATUS.ACTIVE,
    },
  },
  {
    timestamps: true,
    collection: TEMPLATE.COLLECTION_NAME,
  }
);

templateSchema.statics.build = async (
  attrs: ITemplateCreate
): Promise<ITemplate> => {
  return await TemplateModel.create(
    formatAttributeName(attrs, TEMPLATE.PREFIX)
  );
};

export const TemplateModel =
  // models[TEMPLATE.DOCUMENT_NAME] ||
  model<ITemplateDocument, ITemplateModel>(
    TEMPLATE.COLLECTION_NAME,
    templateSchema
  );
