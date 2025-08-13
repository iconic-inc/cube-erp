import { Router } from 'express';
import { AttendanceRequestController } from '@controllers/attendanceRequest.controller';
import { authenticationV2 } from '@middlewares/authentication';
import { hasPermission } from '@middlewares/authorization';
import { validateObjectId } from '@schemas/index';

const router = Router();

// Route để lấy danh sách chấm công của nhân viên
router.get(
  '/employee/:employeeId',
  validateObjectId('employeeId'),
  authenticationV2,
  hasPermission('attendance', 'readAny'),
  AttendanceRequestController.getEmployeeAttendanceRequests
);

router.get(
  '/:requestId',
  validateObjectId('requestId'),
  authenticationV2,
  hasPermission('attendance', 'readAny'),
  AttendanceRequestController.getAttendanceRequestById
);

router.get(
  '/',
  authenticationV2,
  hasPermission('attendance', 'readAny'),
  AttendanceRequestController.getAttendanceRequests
);

router.put(
  '/:requestId/accept',
  validateObjectId('requestId'),
  authenticationV2,
  hasPermission('attendance', 'updateAny'),
  AttendanceRequestController.acceptAttendanceRequest
);

router.put(
  '/:requestId/reject',
  validateObjectId('requestId'),
  authenticationV2,
  hasPermission('attendance', 'updateAny'),
  AttendanceRequestController.rejectAttendanceRequest
);

module.exports = router;
