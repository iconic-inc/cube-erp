import { Schema, model, Model, models } from 'mongoose';
import { RESOURCE } from '../constants';

interface IResource {
  name: string;
  slug: string;
  description: string;
}

interface IResourceModel extends Model<IResource> {
  build(attrs: IResource): Promise<IResource>;
}

const resourceSchema = new Schema<IResource, IResourceModel>(
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

resourceSchema.statics.build = (attrs: IResource) => {
  return ResourceModel.create(attrs);
};

export const ResourceModel = model<IResource, IResourceModel>(
  RESOURCE.DOCUMENT_NAME,
  resourceSchema
);
