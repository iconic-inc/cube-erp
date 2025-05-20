import { IImage } from './image.interface';

export interface IAppSettings {
  app_title: string;
  app_description: string;
  app_logo?: IImage;
  app_social: {
    facebook: string;
    youtube: string;
    tiktok: string;
    zalo: string;
  };
  app_taxCode: string;
  app_headScripts?: string;
  app_bodyScripts?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAppSettingsCreate {
  title: string;
  description: string;
  logo: string;
  social: {
    facebook?: string;
    youtube?: string;
    tiktok?: string;
    zalo?: string;
  };
  taxCode: string;
  headScripts?: string;
  bodyScripts?: string;
}

export interface IPaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IResponseList<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
