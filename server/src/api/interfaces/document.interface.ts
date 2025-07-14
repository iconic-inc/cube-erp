import { HydratedDocument, ObjectId } from 'mongoose';
import { IEmployeePopulate } from './employee.interface';
import { Model } from 'mongoose';

export interface IDocumentPopulate {
  id: string;
  doc_name: string;
  doc_type?: string;
  doc_description?: string;
  doc_url: string;
  doc_isPublic: boolean;
  doc_createdBy: IEmployeePopulate;
  doc_whiteList: IEmployeePopulate[]; // Array of Employee IDs allowed to access the document
}

export interface IDocument
  extends Omit<IDocumentPopulate, 'doc_createdBy' | 'doc_whiteList'> {
  doc_createdBy: ObjectId;
  doc_whiteList: ObjectId[]; // Array of Employee IDs allowed to access the document
  createdAt: Date;
  updatedAt: Date;
}

export interface IDocumentCreate {
  name: string;
  type?: string;
  description?: string;
  url: string;
  isPublic?: boolean;
  createdBy: string; // Employee ID of the creator
  whiteList?: string[]; // Array of Employee IDs allowed to access the document
}

export type IDocumentDocument = HydratedDocument<IDocument>;

export interface IDocumentModel extends Model<IDocumentDocument> {
  build(attrs: IDocumentCreate): Promise<IDocumentDocument>;
}

/**
 * Interface for document query parameters
 */
export interface IDocumentQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  type?: string;
  startDate?: string;
  endDate?: string;
  isPublic?: string;
  createdBy?: string; // Employee ID of the creator
}
