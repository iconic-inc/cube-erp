import { HydratedDocument, Model, ObjectId } from 'mongoose';

export interface IDocumentCase {
  document: ObjectId; // Reference to the document
  caseService: ObjectId; // Reference to the case service
  createdBy: ObjectId; // Employee who created the relationship
  createdAt: Date;
  updatedAt: Date;
}

export interface IDocumentCaseCreate {
  document: ObjectId | string;
  caseService: ObjectId | string;
  createdBy: ObjectId | string;
}

export type IDocumentCaseDocument = HydratedDocument<IDocumentCase>;

export interface IDocumentCaseModel extends Model<IDocumentCaseDocument> {
  build(attrs: IDocumentCaseCreate): Promise<IDocumentCaseDocument>;
}
