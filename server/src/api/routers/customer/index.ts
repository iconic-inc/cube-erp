import { Router } from 'express';
import { CustomerController } from '@controllers/customer.controller';
import { authenticationV2 } from '@middlewares/authentication';
import { hasPermission } from '@middlewares/authorization';
import { validateObjectId, validateSchema } from '@schemas/index';
import {
  customerBulkDeleteSchema,
  customerCreateSchema,
} from '@schemas/customer.schema';

const router = Router();

// Require authentication for all routes
router.use(authenticationV2);

// Route để xuất danh sách nhân viên sang XLSX
router.get(
  '/export/xlsx',
  hasPermission('employee', 'readAny'),
  CustomerController.exportCustomersToXLSX
);

// Get customer by ID
router.get(
  '/:id',
  validateObjectId('id'),
  hasPermission('customer', 'readAny'),
  CustomerController.getCustomerById
);

// Get all customers
router.get(
  '/',
  hasPermission('customer', 'readAny'),
  CustomerController.getCustomers
);

// Create new customer
router.post(
  '/',
  validateSchema(customerCreateSchema),
  hasPermission('customer', 'createAny'),
  CustomerController.createCustomer
);

// Delete multiple customers
router.delete(
  '/delete-multiple',
  validateSchema(customerBulkDeleteSchema),
  hasPermission('customer', 'deleteAny'),
  CustomerController.deleteMultipleCustomers
);

// Update customer
router.put(
  '/:id',
  validateObjectId('id'),
  hasPermission('customer', 'updateAny'),
  CustomerController.updateCustomer
);
// Delete customer
router.delete(
  '/:id',
  validateObjectId('id'),
  hasPermission('customer', 'deleteAny'),
  CustomerController.deleteCustomer
);

module.exports = router;
