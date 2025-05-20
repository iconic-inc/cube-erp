import { Router } from "express";
import { NotificationController } from "../../controllers/notification.controller";
import { authenticationV2 } from "@middlewares/authentication";
import { hasPermission } from "@middlewares/authorization";

const router = Router();

// Tất cả routes đều yêu cầu xác thực
router.use(authenticationV2);

// Lấy thông báo của user hiện tại
router.get("/me", NotificationController.getMyNotifications);

// Đếm số thông báo chưa đọc
router.get("/unread/count", NotificationController.countUnread);

// Đánh dấu tất cả là đã đọc
router.put("/mark-all-read", NotificationController.markAllAsRead);

// Route cho người dùng đánh dấu thông báo của chính họ đã đọc
router.put("/me/:notificationId/mark-read", NotificationController.markAsRead);

// Lấy tất cả thông báo (yêu cầu quyền admin)
router.get(
  "/",
  hasPermission("notification", "read"),
  NotificationController.getAllNotifications
);

// Admin route để đánh dấu thông báo đã đọc
router.put(
  "/:notificationId/mark-read",
  hasPermission("notification", "update"),
  NotificationController.markAsRead
);

router.delete(
  "/:notificationId",
  hasPermission("notification", "delete"),
  NotificationController.deleteNotification
);

// Tạo thông báo cho nhiều nhân viên (yêu cầu quyền admin)
router.post(
  "/admin/create",
  hasPermission("notification", "create"),
  NotificationController.createAdminNotification
);

// Lấy thông báo theo ID
router.get(
  "/:notificationId",
  hasPermission("notification", "read"),
  NotificationController.getNotificationById
);

// Cập nhật thông báo
router.put(
  "/:notificationId",
  hasPermission("notification", "update"),
  NotificationController.updateNotification
);

module.exports = router;
