import { Router } from 'express';
import { EmployeeController } from '@controllers/employee.controller';
import { authenticationV2 } from '@middlewares/authentication';
import { hasPermission } from '@middlewares/authorization';

const router = Router();

// Tất cả routes đều yêu cầu xác thực
router.use(authenticationV2);

// Route để tạo nhân viên mới kèm user
router.post(
  '/',
  hasPermission('employee', 'createAny'),
  EmployeeController.createEmployee
);

// Employee KPI route
// router.use('/:userId/kpi', require('../kpi').employeeKPIRouter);

router.get(
  '/me',
  hasPermission('employee', 'readOwn'),
  EmployeeController.getCurrentEmployeeByUserId
);

// Route để lấy thông tin một nhân viên
router.get(
  '/user/:userId',
  hasPermission('employee', 'readAny'),
  EmployeeController.getEmployeeByUserId
);

// Route để lấy thông tin một nhân viên
router.get(
  '/:id',
  hasPermission('employee', 'readAny'),
  EmployeeController.getEmployeeById
);

// Self update route
router.put(
  '/me',
  hasPermission('employee', 'updateOwn'),
  EmployeeController.updateCurrentEmployee
);

// Route để cập nhật thông tin nhân viên
router.put(
  '/:id',
  hasPermission('employee', 'updateAny'),
  EmployeeController.updateEmployee
);

// Route để xóa nhiều nhân viên
router.delete(
  '/bulk',
  hasPermission('employee', 'deleteAny'),
  EmployeeController.bulkDeleteEmployees
);

// Route để xóa nhân viên
router.delete(
  '/:id',
  hasPermission('employee', 'deleteAny'),
  EmployeeController.deleteEmployee
);

// Route để lấy danh sách nhân viên
router.get(
  '/',
  hasPermission('employee', 'readAny'),
  EmployeeController.getEmployees
);

// Route để xuất danh sách nhân viên sang CSV
router.get(
  '/export/csv',
  hasPermission('employee', 'readAny'),
  EmployeeController.exportEmployeesToCSV
);

// Route để xuất danh sách nhân viên sang XLSX
router.get(
  '/export/xlsx',
  hasPermission('employee', 'readAny'),
  EmployeeController.exportEmployeesToXLSX
);

module.exports = router;
