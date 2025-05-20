import { Router } from 'express';
import { AttendanceController } from '@controllers/attendance.controller';
import { authenticationV2 } from '@middlewares/authentication';
import { hasPermission } from '@middlewares/authorization';

const router = Router();

// Route để admin tạo QR code
router.get(
  '/qr-code',
  authenticationV2,
  AttendanceController.generateAttendanceQR
);

// Route để nhân viên check-in
router.post(
  '/check-in',
  authenticationV2,
  hasPermission('attendance', 'create'),
  AttendanceController.checkIn
);
router.post(
  '/check-out',
  authenticationV2,
  hasPermission('attendance', 'update'),
  AttendanceController.checkOut
);

// Route để lấy thống kê chấm công của ngày hiện tại
router.get(
  '/stats/today',
  authenticationV2,
  hasPermission('attendance', 'read'),
  AttendanceController.getTodayAttendanceStats
);

// Route để lấy thống kê chấm công trong 7 ngày gần nhất
router.get(
  '/stats/:userId',
  authenticationV2,
  hasPermission('attendance', 'read'),
  AttendanceController.getLast7DaysStats
);

// Route để lấy thống kê chấm công theo tháng
router.get(
  '/stats',
  authenticationV2,
  hasPermission('attendance', 'read'),
  AttendanceController.getAttendanceStats
);

// Route để lấy thông tin chấm công của ngày hiện tại
router.get(
  '/today',
  authenticationV2,
  hasPermission('attendance', 'read'),
  AttendanceController.getTodayAttendance
);

router.put(
  '/:attendanceId',
  authenticationV2,
  hasPermission('attendance', 'update'),
  AttendanceController.updateAttendance
);

router.delete(
  '/:attendanceId',
  authenticationV2,
  hasPermission('attendance', 'delete'),
  AttendanceController.deleteAttendance
);

module.exports = router;
