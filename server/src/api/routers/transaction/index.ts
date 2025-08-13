import { Router } from 'express';
import { TransactionController } from '@controllers/transaction.controller';
import { authenticationV2 } from '@middlewares/authentication';
import { hasPermission } from '@middlewares/authorization';
import {
  validateObjectId,
  validateSchema,
  validateQuery,
} from '@schemas/index';
import {
  transactionCreateSchema,
  transactionUpdateSchema,
  transactionQuerySchema,
  transactionBulkDeleteSchema,
} from '@schemas/transaction.schema';

const router = Router();

// Require authentication for all routes
router.use(authenticationV2);

// Export transactions to XLSX
router.get(
  '/export/xlsx',
  hasPermission('transaction', 'readAny'),
  TransactionController.exportTransactionsToXLSX
);

// Get transaction statistics
router.get(
  '/statistics',
  hasPermission('transaction', 'readAny'),
  TransactionController.getTransactionStatistics
);

// Create a new transaction
router.post(
  '/',
  validateSchema(transactionCreateSchema),
  hasPermission('transaction', 'createAny'),
  TransactionController.createTransaction
);

// Get single transaction by ID
router.get(
  '/:id',
  validateObjectId('id'),
  hasPermission('transaction', 'readAny'),
  TransactionController.getTransactionById
);

// Get all transactions with filtering, pagination, search, and sorting
router.get(
  '/',
  validateQuery(transactionQuerySchema),
  hasPermission('transaction', 'readAny'),
  TransactionController.getAllTransactions
);

// Update a transaction
router.put(
  '/:id',
  validateObjectId('id'),
  validateSchema(transactionUpdateSchema),
  hasPermission('transaction', 'updateAny'),
  TransactionController.updateTransaction
);

// Delete multiple transactions
router.delete(
  '/bulk',
  validateSchema(transactionBulkDeleteSchema),
  hasPermission('transaction', 'deleteAny'),
  TransactionController.bulkDeleteTransactions
);

// Delete a transaction by ID
router.delete(
  '/:id',
  validateObjectId('id'),
  hasPermission('transaction', 'deleteAny'),
  TransactionController.deleteTransaction
);

module.exports = router;
