import { Schema, Types, model, models } from 'mongoose';
import {
  IImageCreate,
  IImageDocument,
  IImageModel,
} from '../interfaces/image.interface';
import { formatAttributeName } from '../utils';
import { IMAGE } from '../constants';

const sliderSchema = new Schema<IImageDocument, IImageModel>(
  {
    img_name: { type: String, required: true, unique: true },
    img_title: { type: String, required: true },
    img_type: { type: String },
    img_description: { type: String },
    img_link: { type: String },
    img_url: { type: String, required: true },
    img_isPublic: { type: Boolean, required: true, default: true },
  },
  {
    timestamps: true,
    collection: IMAGE.COLLECTION_NAME,
  }
);

sliderSchema.statics.build = (attrs: IImageCreate) => {
  return ImageModel.create(formatAttributeName(attrs, IMAGE.PREFIX));
};

export const ImageModel =
  // models[IMAGE.DOCUMENT_NAME] ||
  model<IImageDocument, IImageModel>(IMAGE.DOCUMENT_NAME, sliderSchema);
