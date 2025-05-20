import { IImage } from './image.interface';
import { ISpa } from './spa.interface';
import { IUser } from './user.interface';

export interface IReviewCreate {
  spa: string;
  author: string;
  rating: number;
  title?: string;
  content: string;
  images?: string[]; // ref Image[]
  likes?: number;
  isApproved?: boolean;
}

export interface IReview {
  id: string;
  rv_spa: string; // ref Spa
  rv_author: string; // ref User
  rv_rating: number; // 1‒5
  rv_content: string;
  rv_likes?: number;
  rv_isApproved?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReviewDetails extends IReview {
  rv_images?: IImage[]; // ref Image[]
  rv_title?: string;
}
