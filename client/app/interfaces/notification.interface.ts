export interface INotification {
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
  type: 'attendance' | 'system' | 'general' | 'work' | 'event';
  isRead: boolean;
  metadata: {
    checkInTime?: string;
    status?: 'success' | 'late' | 'failed' | 'early' | 'absent';
    requireResponse?: boolean;
    includeButtons?: boolean;
    buttons?: {
      text: string;
      type: 'primary' | 'success' | 'danger' | 'warning' | 'default';
    }[];
    schedule?: {
      date: string | null;
      time: string | null;
    };
    priority: 'low' | 'medium' | 'high' | 'urgent';
  };
  createdAt: string;
  updatedAt: string;
}

export interface INotificationResponse {
  message: string;
  metadata: INotification;
}

export interface INotificationListResponse {
  notifications: INotification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface INotificationCountResponse {
  message: string;
  metadata: {
    count: number;
  };
}

export interface ICreateNotificationData {
  senderId: string;
  recipientId: string;
  title: string;
  message: string;
  type?: 'attendance' | 'system' | 'general' | 'work' | 'event';
  metadata?: {
    checkInTime?: Date;
    status?: 'success' | 'late' | 'failed' | 'early' | 'absent';
  };
}

export interface IMarkAsReadResponse {
  message: string;
  metadata: {
    success: boolean;
  };
}

export interface IDeleteNotificationResponse {
  message: string;
  metadata: {
    success: boolean;
  };
}

export interface IAdminCreateNotificationData {
  recipientIds: string[];
  title: string;
  message: string;
  type: 'attendance' | 'system' | 'general' | 'work' | 'event';
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

export interface INotificationQueryParams {
  page?: number;
  limit?: number;
  type?: string;
  isRead?: boolean;
}

export interface INotificationLoaderData {
  notifications: INotification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  currentUser: any;
}

export interface INotificationActionData {
  success: boolean;
  message?: string;
  data?: any;
  redirectTo?: string;
}
