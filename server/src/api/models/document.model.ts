// filepath: /home/phanhotboy/workspace/iconic/cube-erp/server/src/api/models/document.model.ts
import { Schema, model } from 'mongoose';
import { DOCUMENT, DOCUMENT_FOLDER, USER } from '../constants';
import {
  IDocumentCreate,
  IDocumentDocument,
  IDocumentModel,
} from '../interfaces/document.interface';
import { formatAttributeName } from '../utils';

const documentSchema = new Schema<IDocumentDocument, IDocumentModel>(
  {
    doc_name: {
      type: String,
      required: true,
      trim: true,
    },
    doc_parent: {
      type: Schema.Types.ObjectId,
      ref: DOCUMENT_FOLDER.DOCUMENT_NAME,
      required: true,
    },
    doc_description: {
      type: String,
      trim: true,
    },
    doc_url: {
      type: String,
      required: true,
    },
    doc_isPublic: {
      type: Boolean,
      default: false,
    },
    doc_createdBy: {
      type: Schema.Types.ObjectId,
      ref: USER.EMPLOYEE.DOCUMENT_NAME,
      required: true,
    },
    doc_whiteList: {
      type: [Schema.Types.ObjectId],
      ref: USER.EMPLOYEE.DOCUMENT_NAME,
      default: [],
    },
  },
  {
    timestamps: true,
    collection: DOCUMENT.COLLECTION_NAME,
  }
);

documentSchema.statics.build = (attrs: IDocumentCreate) => {
  return DocumentModel.create(formatAttributeName(attrs, DOCUMENT.PREFIX));
};

export const DocumentModel = model<IDocumentDocument, IDocumentModel>(
  DOCUMENT.DOCUMENT_NAME,
  documentSchema
);
