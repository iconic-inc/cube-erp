import { Router } from 'express';
import { AttendanceRequestController } from '@controllers/attendanceRequest.controller';
import { authenticationV2 } from '@middlewares/authentication';
import { hasPermission } from '@middlewares/authorization';
import { validateObjectId } from '@schemas/index';

const router = Router();

router.get(
  '/:requestId',
  validateObjectId('requestId'),
  authenticationV2,
  hasPermission('attendance', 'readOwn'),
  AttendanceRequestController.getMyAttendanceRequestById
);

router.get(
  '/',
  authenticationV2,
  hasPermission('attendance', 'readOwn'),
  AttendanceRequestController.getMyAttendanceRequests
);

router.post(
  '/',
  authenticationV2,
  hasPermission('attendance', 'createOwn'),
  AttendanceRequestController.createAttendanceRequest
);

module.exports = router;
