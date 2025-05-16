import { HydratedDocument, Model } from 'mongoose';

export interface IRawResource {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IResourceAttrs {
  name: string;
  slug: string;
  description: string;
}

export interface IResourceInput {
  name: string;
  slug: string;
  description: string;
}

export type IResource = HydratedDocument<IRawResource>;

export interface IResourceModel extends Model<IResource> {
  build(attrs: IResourceAttrs): Promise<IResource>;
}

export interface IResourceResponseData {
  id: string;
  name: string;
  slug: string;
  description: string;
} 