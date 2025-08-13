import { Router } from 'express';
import { EmployeeController } from '@controllers/employee.controller';
import { authenticationV2 } from '@middlewares/authentication';
import { hasPermission } from '@middlewares/authorization';
import {
  validateObjectId,
  validateSchema,
  validateQuery,
} from '@schemas/index';
import {
  employeeCreateSchema,
  employeeUpdateSchema,
  employeeQuerySchema,
  employeeBulkDeleteSchema,
  employeeExportSchema,
} from '@schemas/employee.schema';

const router = Router();

// Tất cả routes đều yêu cầu xác thực
router.use(authenticationV2);

router.use('/me/tasks', require('../task/employee'));

// Route để tạo nhân viên mới kèm user
router.post(
  '/',
  validateSchema(employeeCreateSchema),
  hasPermission('employee', 'createAny'),
  EmployeeController.createEmployee
);

// Employee KPI route
router.use('/me/case-services', require('../caseService/employee'));
router.use('/me/attendance', require('../attendance/employee'));
router.use('/me/attendance-requests', require('../attendanceRequest/employee'));
router.use('/me/rewards', require('../reward/employee'));
router.get(
  '/me',
  hasPermission('employee', 'readOwn'),
  EmployeeController.getCurrentEmployeeByUserId
);

// Route để lấy thông tin một nhân viên
router.get(
  '/user/:userId',
  validateObjectId('userId'),
  hasPermission('employee', 'readAny'),
  EmployeeController.getEmployeeByUserId
);

// Route để lấy thông tin một nhân viên
router.get(
  '/:id',
  validateObjectId('id'),
  hasPermission('employee', 'readAny'),
  EmployeeController.getEmployeeById
);

// Self update route
router.put(
  '/me',
  validateSchema(employeeUpdateSchema),
  hasPermission('employee', 'updateOwn'),
  EmployeeController.updateCurrentEmployee
);

// Route để cập nhật thông tin nhân viên
router.put(
  '/:id',
  validateObjectId('id'),
  validateSchema(employeeUpdateSchema),
  hasPermission('employee', 'updateAny'),
  EmployeeController.updateEmployee
);

// Route để xóa nhiều nhân viên
router.delete(
  '/bulk',
  validateSchema(employeeBulkDeleteSchema),
  hasPermission('employee', 'deleteAny'),
  EmployeeController.bulkDeleteEmployees
);

// Route để xóa nhân viên
router.delete(
  '/:id',
  validateObjectId('id'),
  hasPermission('employee', 'deleteAny'),
  EmployeeController.deleteEmployee
);

// Route để xuất danh sách nhân viên sang CSV
router.get(
  '/export/csv',
  validateQuery(employeeExportSchema),
  hasPermission('employee', 'readAny'),
  EmployeeController.exportEmployeesToCSV
);

// Route để xuất danh sách nhân viên sang XLSX
router.get(
  '/export/xlsx',
  validateQuery(employeeExportSchema),
  hasPermission('employee', 'readAny'),
  EmployeeController.exportEmployeesToXLSX
);

// Route để lấy danh sách nhân viên
router.get(
  '/',
  validateQuery(employeeQuerySchema),
  hasPermission('employee', 'readAny'),
  EmployeeController.getEmployees
);

module.exports = router;
