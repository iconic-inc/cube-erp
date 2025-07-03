import { Router } from 'express';
import { AttendanceController } from '@controllers/attendance.controller';
import { authenticationV2 } from '@middlewares/authentication';
import { hasPermission } from '@middlewares/authorization';
import { validateObjectId } from '@schemas/index';

const router = Router();

// Route để admin tạo QR code
router.get(
  '/qr-code',
  authenticationV2,
  AttendanceController.generateAttendanceQR
);

// Route để lấy thống kê chấm công của ngày hiện tại
router.get(
  '/stats/today',
  authenticationV2,
  hasPermission('attendance', 'readAny'),
  AttendanceController.getTodayAttendanceStats
);

// Route để lấy thống kê chấm công trong 7 ngày gần nhất
router.get(
  '/stats/:userId',
  authenticationV2,
  hasPermission('attendance', 'readAny'),
  AttendanceController.getLast7DaysStats
);

// Route để lấy thống kê chấm công theo tháng
router.get(
  '/stats',
  authenticationV2,
  hasPermission('attendance', 'readAny'),
  AttendanceController.getAttendanceStats
);

// Route để lấy thông tin chấm công của ngày hiện tại
router.get(
  '/today',
  authenticationV2,
  hasPermission('attendance', 'readAny'),
  AttendanceController.getTodayAttendance
);

// Route để lấy danh sách chấm công của nhân viên
router.get(
  '/employee/:employeeId',
  validateObjectId('employeeId'),
  authenticationV2,
  hasPermission('attendance', 'readAny'),
  AttendanceController.getEmployeeAttendances
);

router.put(
  '/:attendanceId',
  authenticationV2,
  hasPermission('attendance', 'updateAny'),
  AttendanceController.updateAttendance
);

router.delete(
  '/:attendanceId',
  authenticationV2,
  hasPermission('attendance', 'deleteAny'),
  AttendanceController.deleteAttendance
);

module.exports = router;
