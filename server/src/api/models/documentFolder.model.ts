import { Schema, model } from 'mongoose';
import { DOCUMENT_FOLDER, USER } from '../constants';
import {
  IDocumentFolderCreate,
  IDocumentFolderDocument,
  IDocumentFolderModel,
} from '../interfaces/documentFolder.interface';
import { formatAttributeName } from '../utils';

const documentFolderSchema = new Schema<
  IDocumentFolderDocument,
  IDocumentFolderModel
>(
  {
    fol_name: {
      type: String,
      required: true,
      trim: true,
    },
    fol_owner: {
      type: Schema.Types.ObjectId,
      ref: USER.EMPLOYEE.DOCUMENT_NAME,
      required: true,
    },
    // fol_parent: {
    //   type: Schema.Types.ObjectId,
    //   ref: DOCUMENT_FOLDER.DOCUMENT_NAME,
    // },
  },
  {
    timestamps: true,
    collection: DOCUMENT_FOLDER.COLLECTION_NAME,
  }
);

documentFolderSchema.statics.build = (attrs: IDocumentFolderCreate) => {
  return DocumentFolderModel.create(
    formatAttributeName(attrs, DOCUMENT_FOLDER.PREFIX)
  );
};

export const DocumentFolderModel = model<
  IDocumentFolderDocument,
  IDocumentFolderModel
>(DOCUMENT_FOLDER.DOCUMENT_NAME, documentFolderSchema);
