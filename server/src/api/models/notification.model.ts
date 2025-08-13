import { Schema, model, Types, Model } from 'mongoose';
import {
  INotificationCreate,
  INotificationDocument,
  INotificationModel,
} from '../interfaces/notification.interface';
import { NOTIFICATION } from '@constants/notification.constant';

const notificationSchema = new Schema<
  INotificationDocument,
  INotificationModel
>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION.TYPE),
      default: 'general',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: NOTIFICATION.COLLECTION_NAME,
  }
);

notificationSchema.statics.build = (attrs: INotificationCreate) => {
  return NotificationModel.create(attrs);
};

export const NotificationModel = model<
  INotificationDocument,
  INotificationModel
>(NOTIFICATION.DOCUMENT_NAME, notificationSchema);
