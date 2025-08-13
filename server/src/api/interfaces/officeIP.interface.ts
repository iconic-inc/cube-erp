import { HydratedDocument, Model, ObjectId } from 'mongoose';

export interface IOfficeIP {
  officeName: string;
  ipAddress: string;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type IOfficeIPDocument = HydratedDocument<IOfficeIP>;

export interface IOfficeIPCreate {
  officeName: string;
  ipAddress: string;
  status?: boolean;
}

export interface IOfficeIPModel extends Model<IOfficeIPDocument> {
  build(attrs: IOfficeIPCreate): Promise<IOfficeIPDocument>;
}
