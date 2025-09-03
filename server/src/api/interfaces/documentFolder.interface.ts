import { HydratedDocument, ObjectId } from 'mongoose';
import { IEmployeePopulate } from './employee.interface';
import { Model } from 'mongoose';

export interface IDocumentFolder {
  id: string;
  fol_name: string;
  fol_owner: IEmployeePopulate;
  // fol_parent: IDocumentFolder;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDocumentFolderCreate {
  name: string;
  owner: ObjectId | string;
  // parent: ObjectId | string;
}

export interface IDocumentFolderQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
  owner?: string;
}

export type IDocumentFolderDocument = HydratedDocument<IDocumentFolder>;

export interface IDocumentFolderModel extends Model<IDocumentFolderDocument> {
  build(attrs: IDocumentFolderCreate): Promise<IDocumentFolderDocument>;
}
