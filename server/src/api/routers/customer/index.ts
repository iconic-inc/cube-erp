import { Router } from 'express';
import { CustomerController } from '@controllers/customer.controller';
import { authenticationV2 } from '@middlewares/authentication';
import { hasPermission } from '@middlewares/authorization';

const router = Router();

// Require authentication for all routes
router.use(authenticationV2);

// Route để xuất danh sách nhân viên sang XLSX
router.get(
  '/export/xlsx',
  hasPermission('employee', 'readAny'),
  CustomerController.exportCustomersToXLSX
);

// Get all customers
router.get(
  '/',
  hasPermission('customer', 'read'),
  CustomerController.getCustomers
);

// Create new customer
router.post(
  '/',
  hasPermission('customer', 'create'),
  CustomerController.createCustomer
);

// Delete multiple customers
router.delete(
  '/delete-multiple',
  hasPermission('customer', 'delete'),
  CustomerController.deleteMultipleCustomers
);

// Get customer by ID
router.get(
  '/:id',
  hasPermission('customer', 'read'),
  CustomerController.getCustomerById
);

// Update customer
router.put(
  '/:id',
  hasPermission('customer', 'update'),
  CustomerController.updateCustomer
);
// Delete customer
router.delete(
  '/:id',
  hasPermission('customer', 'delete'),
  CustomerController.deleteCustomer
);

module.exports = router;
