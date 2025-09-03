import { IEmployeeBrief } from './employee.interface';

export interface IDocumentFolder {
  id: string;
  fol_name: string;
  fol_owner: IEmployeeBrief;
  createdAt: string;
  updatedAt: string;
}

export interface IDocumentFolderCreate {
  name: string;
  owner?: string;
}

export interface IDocumentFolderUpdate {
  name?: string;
  owner?: string;
}
