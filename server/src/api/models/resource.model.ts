import { Schema, model, Model, models } from 'mongoose';
import { RESOURCE } from '../constants';
import {
  IResourceCreate,
  IResourceDocument,
  IResourceModel,
} from '../interfaces/resource.interface';

const resourceSchema = new Schema<IResourceDocument, IResourceModel>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: RESOURCE.COLLECTION_NAME,
  }
);

resourceSchema.statics.build = (attrs: IResourceCreate) => {
  return ResourceModel.create(attrs);
};

export const ResourceModel = model<IResourceDocument, IResourceModel>(
  RESOURCE.DOCUMENT_NAME,
  resourceSchema
);
