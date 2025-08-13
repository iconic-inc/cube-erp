import { Schema, model } from 'mongoose';
import { DOCUMENT_CASE, DOCUMENT, CASE_SERVICE, USER } from '../constants';
import {
  IDocumentCaseCreate,
  IDocumentCaseDocument,
  IDocumentCaseModel,
} from '../interfaces/documentCase.interface';

const documentCaseSchema = new Schema<
  IDocumentCaseDocument,
  IDocumentCaseModel
>(
  {
    document: {
      type: Schema.Types.ObjectId,
      ref: DOCUMENT.DOCUMENT_NAME,
      required: true,
    },
    caseService: {
      type: Schema.Types.ObjectId,
      ref: CASE_SERVICE.DOCUMENT_NAME,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: USER.EMPLOYEE.DOCUMENT_NAME,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: DOCUMENT_CASE.COLLECTION_NAME,
  }
);

// Create a compound index to ensure a document can only be attached to a case once
documentCaseSchema.index({ document: 1, caseService: 1 }, { unique: true });

documentCaseSchema.statics.build = (attrs: IDocumentCaseCreate) => {
  return DocumentCaseModel.create(attrs);
};

export const DocumentCaseModel = model<
  IDocumentCaseDocument,
  IDocumentCaseModel
>(DOCUMENT_CASE.DOCUMENT_NAME, documentCaseSchema);
