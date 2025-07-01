import { Router } from 'express';
import { AttendanceController } from '@controllers/attendance.controller';
import { authenticationV2 } from '@middlewares/authentication';
import { hasPermission } from '@middlewares/authorization';

const router = Router();

// Route để nhân viên check-in
router.post(
  '/check-in',
  authenticationV2,
  hasPermission('attendance', 'createOwn'),
  AttendanceController.checkIn
);
router.post(
  '/check-out',
  authenticationV2,
  hasPermission('attendance', 'updateOwn'),
  AttendanceController.checkOut
);

// Route để lấy thống kê chấm công của ngày hiện tại
router.get(
  '/stats/today',
  authenticationV2,
  hasPermission('attendance', 'readOwn'),
  AttendanceController.getTodayAttendanceStats
);

// Route để lấy thống kê chấm công trong 7 ngày gần nhất
router.get(
  '/stats/week',
  authenticationV2,
  hasPermission('attendance', 'readOwn'),
  AttendanceController.getLast7DaysStats
);

// Route để lấy thống kê chấm công theo tháng
router.get(
  '/stats',
  authenticationV2,
  hasPermission('attendance', 'readOwn'),
  AttendanceController.getAttendanceStats
);

// Route để lấy thông tin chấm công của ngày hiện tại
router.get(
  '/today',
  authenticationV2,
  hasPermission('attendance', 'readOwn'),
  AttendanceController.getTodayAttendance
);

module.exports = router;
