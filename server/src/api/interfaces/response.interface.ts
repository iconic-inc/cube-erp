import { Response } from 'express';

export interface ISuccessCreate {
  res: Response;
  message?: string;
  metadata?: Object;
  options?: Object;
  link?: Object;
}

export interface ISuccessReponse {
  message: string;
  metadata: Object;
  options: Object;
  _link: Object;
}

export type ISuccessFunc = (obj: ISuccessCreate) => void;

export interface IResponseList<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
