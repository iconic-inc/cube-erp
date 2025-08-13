import { Types } from 'mongoose';
import { NotificationModel } from '../models/notification.model';
import { BadRequestError, NotFoundError } from '../core/errors';
import { getReturnData } from '@utils/index';
import {
  ICreateNotificationData,
  INotificationQuery,
  INotificationResponse,
  IAdminCreateNotificationData,
} from '../interfaces/notification.interface';

// // ID của tài khoản system (thay thế bằng ID thực tế của system user trong database của bạn)
// const SYSTEM_USER_ID = '67d29e236f885210e0329c70';
// Tạo thông báo mới
const createNotification = async (data: ICreateNotificationData) => {
  try {
    console.log('Creating notification with data:', data);

    const notification = await NotificationModel.build({
      senderId: data.senderId ? new Types.ObjectId(data.senderId) : undefined,
      recipientId: new Types.ObjectId(data.recipientId),
      title: data.title,
      message: data.message,
      type: data.type || 'general',
      isRead: false,
      metadata: data.metadata,
    });

    console.log('Notification created:', notification);
    return getReturnData(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    if (error instanceof Error) {
      throw new BadRequestError(error.message);
    }
    throw new BadRequestError('Failed to create notification');
  }
};

// Tạo thông báo chấm công
const createAttendanceNotification = async (
  recipientId: string,
  checkInTime: Date,
  status: 'success' | 'late' | 'failed' | 'early' | 'absent'
) => {
  try {
    console.log('Creating attendance notification for user:', recipientId);

    let title = '';
    let message = '';

    switch (status) {
      case 'success':
        title = 'Chấm công thành công';
        message = `Bạn đã chấm công thành công lúc ${checkInTime.toLocaleTimeString()}`;
        break;
      case 'late':
        title = 'Chấm công muộn';
        message = `Bạn đã chấm công muộn lúc ${checkInTime.toLocaleTimeString()}`;
        break;
      case 'failed':
        title = 'Chấm công thất bại';
        message = 'Có lỗi xảy ra trong quá trình chấm công';
        break;
      case 'early':
        title = 'Chấm công sớm';
        message = `Bạn đã chấm công sớm lúc ${checkInTime.toLocaleTimeString()}`;
        break;
      case 'absent':
        title = 'Vắng mặt';
        message = 'Bạn đã không chấm công hôm nay';
        break;
      default:
        title = 'Chấm công';
        message = `Bạn đã chấm công lúc ${checkInTime.toLocaleTimeString()}`;
        break;
    }

    // Tạo thông báo mới với senderId là null (thông báo hệ thống)
    const notification = await NotificationModel.build({
      recipientId: new Types.ObjectId(recipientId),
      title,
      message,
      type: 'attendance',
      isRead: false,
      metadata: {
        checkInTime,
        status,
      },
    });

    console.log('Attendance notification created successfully');
    return getReturnData(notification);
  } catch (error) {
    console.error('Error creating attendance notification:', error);
    if (error instanceof Error) {
      throw new BadRequestError(error.message);
    }
    throw new BadRequestError('Failed to create attendance notification');
  }
};

// Lấy danh sách thông báo của user
const getUserNotifications = async (
  userId: string,
  query: INotificationQuery = {}
): Promise<INotificationResponse> => {
  try {
    const {
      page = 1,
      limit = 10,
      isRead,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate,
      type,
    } = query;

    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = { recipientId: new Types.ObjectId(userId) };

    if (typeof isRead === 'boolean') {
      filter.isRead = isRead;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = startDate;
      if (endDate) filter.createdAt.$lte = endDate;
    }

    if (type) {
      filter.type = type;
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [notifications, total] = await Promise.all([
      NotificationModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .populate({
          path: 'senderId',
          select: 'usr_username usr_firstName usr_lastName',
          model: 'User',
        })
        .lean(),
      NotificationModel.countDocuments(filter),
    ]);

    const transformedNotifications = notifications.map((notification: any) => {
      // Xử lý trường hợp senderId là null (thông báo hệ thống)
      const senderInfo = notification.senderId
        ? {
            id: notification.senderId._id.toString(),
            username: notification.senderId.usr_username || '',
            firstName: notification.senderId.usr_firstName || '',
            lastName: notification.senderId.usr_lastName || '',
          }
        : {
            id: '',
            username: 'System',
            firstName: 'System',
            lastName: 'Notification',
          };

      return {
        id: notification._id.toString(),
        senderId: senderInfo,
        recipientId: notification.recipientId.toString(),
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: notification.isRead,
        metadata: notification.metadata,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
      };
    });

    return {
      notifications: transformedNotifications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
      },
    };
  } catch (error) {
    console.error('Error in getUserNotifications:', error);
    throw new BadRequestError('Failed to get notifications');
  }
};

// Đánh dấu thông báo đã đọc
const markAsRead = async (notificationId: string, userId: string) => {
  try {
    console.log('Marking notification as read:', { notificationId, userId });

    // Chuyển đổi ID thành ObjectId
    const notificationObjectId = new Types.ObjectId(notificationId);
    const userObjectId = new Types.ObjectId(userId);

    // Kiểm tra xem thông báo có tồn tại không
    const existingNotification = await NotificationModel.findById(
      notificationObjectId
    );
    if (!existingNotification) {
      throw new NotFoundError('Thông báo không tồn tại');
    }

    // Cập nhật thông báo
    const notification = await NotificationModel.findOneAndUpdate(
      {
        _id: notificationObjectId,
        recipientId: userObjectId,
      },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      throw new NotFoundError('Không thể đánh dấu thông báo đã đọc');
    }

    console.log('Notification marked as read successfully');
    return getReturnData(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    if (error instanceof NotFoundError) {
      throw error;
    }
    if (error instanceof Error && error.name === 'CastError') {
      throw new BadRequestError('Định dạng ID không hợp lệ');
    }
    throw new BadRequestError('Không thể đánh dấu thông báo đã đọc');
  }
};

// Đánh dấu tất cả thông báo đã đọc
const markAllAsRead = async (userId: string) => {
  try {
    console.log('Marking all notifications as read for user:', userId);

    // Chuyển đổi userId sang ObjectId
    const userObjectId = new Types.ObjectId(userId);

    // Cập nhật tất cả thông báo chưa đọc của người dùng
    const result = await NotificationModel.updateMany(
      { recipientId: userObjectId, isRead: false },
      { isRead: true }
    );

    console.log('Marked as read result:', result);
    return { success: true, count: result.modifiedCount };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    if (error instanceof Error && error.name === 'CastError') {
      throw new BadRequestError('Định dạng ID không hợp lệ');
    }
    throw new BadRequestError('Không thể đánh dấu tất cả thông báo đã đọc');
  }
};

// Xóa thông báo
const deleteNotification = async (notificationId: string, userId: string) => {
  try {
    console.log('Attempting to delete notification with:', {
      notificationId,
      userId,
    });

    // Chuyển đổi ID sang ObjectId
    const notificationObjectId = new Types.ObjectId(notificationId);

    // Kiểm tra xem thông báo có tồn tại không
    const existingNotification = await NotificationModel.findOne({
      _id: notificationObjectId,
    });

    console.log('Found notification:', existingNotification);

    if (!existingNotification) {
      throw new NotFoundError('Không tìm thấy thông báo');
    }

    // Xóa thông báo
    const result = await NotificationModel.deleteOne({
      _id: notificationObjectId,
    });

    console.log('Delete result:', result);

    if (result.deletedCount === 0) {
      throw new BadRequestError('Không thể xóa thông báo');
    }

    return { success: true, message: 'Xóa thông báo thành công' };
  } catch (error) {
    console.error('Error deleting notification:', error);
    if (error instanceof NotFoundError || error instanceof BadRequestError) {
      throw error;
    }
    if (error instanceof Error && error.name === 'CastError') {
      throw new BadRequestError('Định dạng ID không hợp lệ');
    }
    throw new BadRequestError('Không thể xóa thông báo');
  }
};

// Đếm số thông báo chưa đọc
const countUnreadNotifications = async (userId: string) => {
  const count = await NotificationModel.countDocuments({
    recipientId: userId,
    isRead: false,
  });

  return { count };
};

const createAdminNotification = async (
  senderId: string,
  data: IAdminCreateNotificationData
) => {
  try {
    console.log('Creating admin notification with data:', data);

    const notifications = await Promise.all(
      data.recipientIds.map(async (recipientId) => {
        const notification = await NotificationModel.build({
          senderId: new Types.ObjectId(senderId),
          recipientId: new Types.ObjectId(recipientId),
          title: data.title,
          message: data.message,
          type: data.type,
          isRead: false,
          metadata: {
            ...data.metadata,
            priority: data.priority || 'medium',
          },
        });
        return notification;
      })
    );

    console.log('Admin notifications created successfully');
    return notifications.map((notification) => getReturnData(notification));
  } catch (error) {
    console.error('Error creating admin notification:', error);
    if (error instanceof Error) {
      throw new BadRequestError(error.message);
    }
    throw new BadRequestError('Failed to create admin notification');
  }
};

// Lấy tất cả thông báo từ database
const getAllNotifications = async (
  query: INotificationQuery = {}
): Promise<INotificationResponse> => {
  try {
    const {
      page = 1,
      limit = 10,
      isRead,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate,
      type,
    } = query;

    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = {};

    if (typeof isRead === 'boolean') {
      filter.isRead = isRead;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = startDate;
      if (endDate) filter.createdAt.$lte = endDate;
    }

    if (type) {
      filter.type = type;
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [notifications, total] = await Promise.all([
      NotificationModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .populate({
          path: 'senderId',
          select: 'usr_username usr_firstName usr_lastName',
          model: 'User',
        })
        .populate({
          path: 'recipientId',
          select: 'usr_username usr_firstName usr_lastName usr_email',
          model: 'User',
        })
        .lean(),
      NotificationModel.countDocuments(filter),
    ]);

    const transformedNotifications = notifications.map((notification: any) => {
      const senderInfo = notification.senderId
        ? {
            id: notification.senderId._id.toString(),
            username: notification.senderId.usr_username || '',
            firstName: notification.senderId.usr_firstName || '',
            lastName: notification.senderId.usr_lastName || '',
          }
        : {
            id: '',
            username: 'System',
            firstName: 'System',
            lastName: 'Notification',
          };

      const recipientInfo = notification.recipientId
        ? {
            id: notification.recipientId._id.toString(),
            username: notification.recipientId.usr_username || '',
            firstName: notification.recipientId.usr_firstName || '',
            lastName: notification.recipientId.usr_lastName || '',
            email: notification.recipientId.usr_email || '',
          }
        : {
            id: '',
            username: '',
            firstName: '',
            lastName: '',
            email: '',
          };

      return {
        id: notification._id.toString(),
        senderId: senderInfo,
        recipientId: recipientInfo,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: notification.isRead,
        metadata: notification.metadata,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
      };
    });

    return {
      notifications: transformedNotifications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
      },
    };
  } catch (error) {
    console.error('Error in getAllNotifications:', error);
    throw new BadRequestError('Failed to get all notifications');
  }
};

// Lấy thông báo theo ID
const getNotificationById = async (notificationId: string) => {
  const notification = await NotificationModel.findById(notificationId)
    .populate({
      path: 'senderId',
      select: 'usr_username usr_firstName usr_lastName',
      model: 'User',
    })
    .populate({
      path: 'recipientId',
      select: 'usr_username usr_firstName usr_lastName usr_email',
      model: 'User',
    });

  if (!notification) {
    throw new NotFoundError('Notification not found');
  }

  return getReturnData(notification);
};

// Cập nhật thông báo
const updateNotification = async (
  notificationId: string,
  data: Partial<IAdminCreateNotificationData>
) => {
  try {
    console.log('Updating notification:', { notificationId, data });

    // Kiểm tra xem thông báo có tồn tại không
    const existingNotification = await NotificationModel.findById(
      notificationId
    );
    if (!existingNotification) {
      throw new NotFoundError('Notification not found');
    }

    // Tạo đối tượng chứa dữ liệu cập nhật
    const updateData: any = {};

    // Cập nhật các trường cơ bản nếu được cung cấp
    if (data.title) updateData.title = data.title;
    if (data.type) updateData.type = data.type;
    if (data.message) updateData.message = data.message;

    // Xử lý metadata
    if (!updateData.metadata) {
      updateData.metadata = existingNotification.metadata
        ? { ...existingNotification.metadata }
        : {};
    }
    if (data.priority) updateData.metadata.priority = data.priority;

    // Xử lý metadata.schedule nếu có
    if (data.metadata?.schedule) {
      updateData.metadata.schedule = data.metadata.schedule;
    }

    // Kiểm tra và cập nhật recipientId nếu có recipientIds
    if (data.recipientIds && data.recipientIds.length > 0) {
      // Lấy recipientId đầu tiên từ mảng (vì mỗi thông báo chỉ có một người nhận)
      updateData.recipientId = new Types.ObjectId(data.recipientIds[0]);
      console.log('Updating recipient to:', data.recipientIds[0]);
    }

    console.log('Final update data:', updateData);

    // Thực hiện cập nhật thông báo
    const notification = await NotificationModel.findByIdAndUpdate(
      notificationId,
      { $set: updateData },
      { new: true }
    )
      .populate({
        path: 'senderId',
        select: 'usr_username usr_firstName usr_lastName',
        model: 'User',
      })
      .populate({
        path: 'recipientId',
        select: 'usr_username usr_firstName usr_lastName usr_email',
        model: 'User',
      });

    if (!notification) {
      throw new NotFoundError('Không thể cập nhật thông báo');
    }

    console.log('Notification updated successfully:', notification);
    return getReturnData(notification);
  } catch (error) {
    console.error('Error updating notification:', error);
    if (error instanceof NotFoundError) {
      throw error;
    }
    if (error instanceof Error) {
      throw new BadRequestError(error.message);
    }
    throw new BadRequestError('Failed to update notification');
  }
};

export {
  createNotification,
  createAttendanceNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  countUnreadNotifications,
  createAdminNotification,
  getAllNotifications,
  getNotificationById,
  updateNotification,
};
