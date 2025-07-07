import { IEmployee } from './employee.interface';

export interface IDocument {
  id: string;
  doc_name: string;
  doc_type?: string;
  doc_description?: string;
  doc_url: string;
  doc_isPublic: boolean;
  doc_createdBy: IEmployee;
  doc_whiteList: IEmployee[];
  createdAt: string;
  updatedAt: string;
}

export interface IDocumentCreate {
  name: string;
  type?: string;
  description?: string;
  file: File;
  isPublic?: boolean;
  whiteList?: string[];
  caseId?: string;
}

export interface IDocumentUpdate {
  name?: string;
  description?: string;
  type?: string;
  isPublic?: boolean;
  whiteList?: string[];
}

export interface IAccessRightsUpdate {
  isPublic?: boolean;
  whiteList?: string[];
}

export interface IDocumentFilter {
  search?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  createdBy?: string;
}
