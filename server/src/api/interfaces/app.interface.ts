import { HydratedDocument, Model, ObjectId } from 'mongoose';

export interface IRawApp {
  app_title: string;
  app_description: string;
  app_logo: ObjectId;
  app_social: {
    facebook: string;
    youtube: string;
    tiktok: string;
    zalo: string;
  };
  app_taxCode: string;
  app_headScripts?: string;
  app_bodyScripts?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IApp = HydratedDocument<IRawApp>;

export interface IAppAttrs {
  title: string;
  description: string;
  logo?: string;
  social: {
    facebook?: string;
    youtube?: string;
    tiktok?: string;
    zalo?: string;
  };
  taxCode: string;
  headScripts?: string;
  bodyScripts?: string;
}

export interface IAppModel extends Model<IApp> {
  build(attrs: IAppAttrs): Promise<IApp>;
}
