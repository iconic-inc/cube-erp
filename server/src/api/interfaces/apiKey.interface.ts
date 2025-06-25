import { Model, HydratedDocument } from 'mongoose';

export interface IApiKey {
  id: string;
  key: string;
  status: boolean;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type IApiKeyDocument = HydratedDocument<IApiKey>;

export interface IApiKeyCreate {
  key: string;
  permissions: string[];
}

export interface IApiKeyModel extends Model<IApiKeyDocument> {
  build(attrs: IApiKeyCreate): Promise<IApiKeyDocument>;
}
