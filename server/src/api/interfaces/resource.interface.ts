import { HydratedDocument, Model } from 'mongoose';

export interface IResource {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IResourceCreate {
  name: string;
  slug: string;
  description: string;
}

export interface IResourceInput {
  name: string;
  slug: string;
  description: string;
}

export type IResourceDocument = HydratedDocument<IResource>;

export interface IResourceModel extends Model<IResourceDocument> {
  build(attrs: IResourceCreate): Promise<IResourceDocument>;
}

export interface IResourceResponseData {
  id: string;
  name: string;
  slug: string;
  description: string;
}
