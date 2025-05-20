import { ISpaOwnerDetails } from './spaOwner.interface';

export interface IOpeningHour {
  /** 0 = Sunday … 6 = Saturday */
  dayOfWeek: number;
  open: string; // “09:00”
  close: string; // “19:00”
  isClosed?: boolean; // Ngày nghỉ lễ, Tết, …
}

export interface IService {
  name: string;
  priceFrom?: number;
  priceTo?: number;
  durationMin?: number; // phút
  description?: string;
}

export interface ILocation {
  type: 'Point';
  /** [lng, lat]  — chuẩn GeoJSON */
  coordinates: [number, number];
  formattedAddress?: string; // “123 Lê Lợi, Q.1, TP.HCM”
}

export interface ISpaCreate {
  name: string;
  slug?: string;
  owner?: string;
  description?: string;
  categories?: string[];
  phone?: string;
  email?: string;
  website?: string;
  socialLinks?: Record<string, string>;
  address: ILocation;
  openingHours?: IOpeningHour[];
  services?: IService[];
  avatar?: string; // ref Image
  coverImage?: string; // ref Image
  gallery?: string[]; // ref Image[]
  averageRating?: number;
  reviewCount?: number;
  lastReviewAt?: Date;
  status?: 'draft' | 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  isFeatured?: boolean;
}

export interface ISpa {
  id: string;
  sp_address: {
    coordinates: [number, number];
    type: string;
    formattedAddress: string;
  };
  sp_name: string;
  sp_slug: string;
  sp_owner: null | ISpaOwnerDetails;
  sp_categories: string[];
  sp_gallery: string[];
  sp_averageRating: string; // average rating
  sp_reviewCount: string; // number of reviews
  sp_status: 'draft' | 'pending' | 'approved' | 'rejected' | 'deleted';
  sp_isFeatured: boolean;
  sp_phone: string;
  sp_email: string;
  sp_website: string;
  createdAt: string;
  updatedAt: string;
}

export interface ISpaDetails extends ISpa {
  sp_owner: ISpa['sp_owner'] & Pick<ISpaOwnerDetails, 'spo_user'>;
  sp_description: string;
  sp_avatar: string; // ref Image
  sp_coverImage: string; // ref Image
  sp_socialLinks: Record<string, string>;
  sp_lastReviewAt: string;
  sp_adminNote: string;
  sp_isFeatured: boolean;
  sp_services: IService[];
  sp_openingHours: IOpeningHour[];
  sp_categories: string[];
  sp_gallery: string[]; // ref Image[]
  sp_address: {
    coordinates: [number, number];
    type: string;
    formattedAddress: string;
  };
}
