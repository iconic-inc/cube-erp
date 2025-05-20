import { Request, Response } from "express";
import { OK } from "../core/success.response";
import * as notificationService from "../services/notification.service";
import { INotificationQuery, IAdminCreateNotificationData } from "../interfaces/notification.interface";

export class NotificationController {
  // Lấy danh sách thông báo của user hiện tại
  static async getMyNotifications(req: Request, res: Response) {
    const userId = req.user?.userId;
    
    // Parse query parameters
    const query: INotificationQuery = {
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      isRead: req.query.isRead ? req.query.isRead === 'true' : undefined,
      sortBy: req.query.sortBy as 'createdAt' | 'updatedAt' | undefined,
      sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      type: req.query.type as string | undefined
    };

    const result = await notificationService.getUserNotifications(userId, query);

    return OK({
      res,
      message: "Notifications retrieved successfully",
      metadata: result,
    });
  }

  // Đánh dấu thông báo đã đọc
  static async markAsRead(req: Request, res: Response) {
    const userId = req.user?.userId;
    const { notificationId } = req.params;

    console.log('Controller - markAsRead:', { userId, notificationId, params: req.params });

    const result = await notificationService.markAsRead(notificationId, userId);

    return OK({
      res,
      message: "Notification marked as read",
      metadata: result,
    });
  }

  // Đánh dấu tất cả thông báo đã đọc
  static async markAllAsRead(req: Request, res: Response) {
    const userId = req.user?.userId;
    
    console.log('Controller - markAllAsRead:', { userId });
    
    const result = await notificationService.markAllAsRead(userId);

    return OK({
      res,
      message: "All notifications marked as read",
      metadata: result,
    });
  }

  // Xóa thông báo
  static async deleteNotification(req: Request, res: Response) {
    const userId = req.user?.userId;
    const { notificationId } = req.params;

    const result = await notificationService.deleteNotification(
      notificationId,
      userId
    );

    return OK({
      res,
      message: "Notification deleted successfully",
      metadata: result,
    });
  }

  // Đếm số thông báo chưa đọc
  static async countUnread(req: Request, res: Response) {
    const userId = req.user?.userId;
    const result = await notificationService.countUnreadNotifications(userId);

    return OK({
      res,
      message: "Unread notifications counted successfully",
      metadata: result,
    });
  }

  // Tạo thông báo cho nhiều nhân viên bởi admin
  static async createAdminNotification(req: Request, res: Response) {
    const senderId = req.user?.userId;
    const data: IAdminCreateNotificationData = req.body;

    const result = await notificationService.createAdminNotification(senderId, data);

    return OK({
      res,
      message: "Notifications created successfully",
      metadata: result,
    });
  }

  // Lấy tất cả thông báo từ database
  static async getAllNotifications(req: Request, res: Response) {
    // Parse query parameters
    const query: INotificationQuery = {
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      isRead: req.query.isRead ? req.query.isRead === 'true' : undefined,
      sortBy: req.query.sortBy as 'createdAt' | 'updatedAt' | undefined,
      sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      type: req.query.type as string | undefined
    };

    const result = await notificationService.getAllNotifications(query);

    return OK({
      res,
      message: "All notifications retrieved successfully",
      metadata: result,
    });
  }

  // Lấy thông báo theo ID
  static async getNotificationById(req: Request, res: Response) {
    const { notificationId } = req.params;
    const result = await notificationService.getNotificationById(notificationId);

    return OK({
      res,
      message: "Notification retrieved successfully",
      metadata: result,
    });
  }

  // Cập nhật thông báo
  static async updateNotification(req: Request, res: Response) {
    const { notificationId } = req.params;
    const data = req.body;
    const result = await notificationService.updateNotification(notificationId, data);

    return OK({
      res,
      message: "Notification updated successfully",
      metadata: result,
    });
  }
}
