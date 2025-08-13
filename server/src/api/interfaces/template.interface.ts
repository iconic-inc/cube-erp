import { HydratedDocument, Model, Types } from 'mongoose';
import { TEMPLATE } from '../constants';

export interface ITemplate {
  tem_name: string;
  tem_html: string;
  tem_status: Values<typeof TEMPLATE.STATUS>;
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITemplateDocument extends HydratedDocument<ITemplate> {}

export interface ITemplateCreate {
  name: string;
  html: string;
  status: ITemplate['tem_status'];
}

export interface ITemplateModel extends Model<ITemplateDocument> {
  build(attrs: ITemplateCreate): Promise<ITemplateDocument>;
}

export interface ITemplateResponseData {
  id: string;
  name: string;
  html: string;
  status: ITemplate['tem_status'];
  createdAt: Date;
  updatedAt: Date;
}
