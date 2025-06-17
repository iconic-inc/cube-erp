import { NOTIFICATION } from '@constants/notification.constant';
import { HydratedDocument, Model, Types } from 'mongoose';

export interface INotification {
  id: string;
  senderId?: Types.ObjectId;
  recipientId: Types.ObjectId;
  title: string;
  message: string;
  type: Values<typeof NOTIFICATION.TYPE>;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationCreate {
  senderId?: Types.ObjectId;
  recipientId: Types.ObjectId;
  title: string;
  message: string;
  type: Values<typeof NOTIFICATION.TYPE>;
  isRead: boolean;
  metadata?: Record<string, any>;
}

export interface ICreateNotificationData {
  senderId: string | null;
  recipientId: string;
  title: string;
  message: string;
  type?: Values<typeof NOTIFICATION.TYPE>;
  metadata?: Record<string, any>;
}

export interface IAttendanceNotificationData {
  recipientId: string;
  checkInTime: Date;
  status: 'success' | 'late' | 'failed';
}

export interface INotificationQuery {
  page?: number;
  limit?: number;
  isRead?: boolean;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  startDate?: Date;
  endDate?: Date;
  type?: string;
}

export interface INotificationResponse {
  notifications: INotificationResponseData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface INotificationResponseData {
  id: string;
  senderId: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  recipientId: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  title: string;
  message: string;
  type: Values<typeof NOTIFICATION.TYPE>;
  isRead: boolean;
  metadata?: {
    checkInTime?: Date;
    status?: 'success' | 'late' | 'failed' | 'early' | 'absent';
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IAdminCreateNotificationData {
  recipientIds: string[];
  title: string;
  message: string;
  type: Values<typeof NOTIFICATION.TYPE>;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: {
    requireResponse?: boolean;
    includeButtons?: boolean;
    buttons?: {
      text: string;
      type: 'primary' | 'success' | 'danger' | 'warning' | 'default';
    }[];
    schedule?: {
      date: string;
      time: string;
    };
  };
}

export type INotificationDocument = HydratedDocument<INotification>;

export interface INotificationModel extends Model<INotificationDocument> {
  build(attrs: INotificationCreate): Promise<INotificationDocument>;
}
