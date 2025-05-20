import { HydratedDocument, Model } from 'mongoose';

export interface IImage {
  img_name: string;
  img_title: string;
  img_type: string;
  img_description: string;
  img_link: string;
  img_url: string;
  img_isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IImageCreate {
  name: string;
  title: string;
  type?: string;
  description?: string;
  link?: string;
  url: string;
  isPublic?: boolean;
}

export type IImageDocument = HydratedDocument<IImage>;

export interface IImageModel extends Model<IImageDocument> {
  build(attrs: IImageCreate): Promise<IImageDocument>;
}
