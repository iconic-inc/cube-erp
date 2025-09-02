import { Router } from 'express';
import { CaseServiceController } from '@controllers/caseService.controller';
import { authenticationV2 } from '@middlewares/authentication';
import { hasPermission } from '@middlewares/authorization';
import { excelImportStorage } from '@configs/config.multer';
import {
  validateObjectId,
  validateSchema,
  validateQuery,
} from '@schemas/index';
import {
  caseServiceCreateSchema,
  caseServiceUpdateSchema,
  caseServiceQuerySchema,
  caseServiceBulkDeleteSchema,
  caseServiceImportOptionsSchema,
  documentIdsSchema,
  caseDocumentIdsSchema,
  createInstallmentSchema,
  addParticipantSchema,
  addPaymentSchema,
  updateParticipantsSchema,
} from '@schemas/caseService.schema';

const router = Router();

// Require authentication for all routes
router.use(authenticationV2);

// Export case services to XLSX
router.get(
  '/export/xlsx',
  hasPermission('caseService', 'readAny'),
  CaseServiceController.exportCaseServicesToXLSX
);

// Get tasks associated with a case service
router.get(
  '/:id/tasks',
  validateObjectId('id'),
  hasPermission('caseService', 'readAny'),
  CaseServiceController.getCaseServiceTasks
);

// Get documents attached to a case service
router.get(
  '/:id/documents',
  validateObjectId('id'),
  hasPermission('caseService', 'readAny'),
  CaseServiceController.getCaseServiceDocuments
);

// attach documents to case services
router.post(
  '/:caseId/documents',
  validateObjectId('caseId'),
  validateSchema(documentIdsSchema),
  hasPermission('caseService', 'updateAny'),
  CaseServiceController.attachDocToCase
);

// detach documents from a case service
router.delete(
  '/:caseId/documents',
  validateObjectId('caseId'),
  validateSchema(caseDocumentIdsSchema),
  hasPermission('caseService', 'updateAny'),
  CaseServiceController.detachDocFromCase
);

// Import case services from XLSX
router.post(
  '/import/xlsx',
  hasPermission('caseService', 'createAny'),
  excelImportStorage.single('file'),
  CaseServiceController.importCaseServices
);

// Create a new case service
router.post(
  '/',
  validateSchema(caseServiceCreateSchema),
  hasPermission('caseService', 'createAny'),
  CaseServiceController.createCaseService
);

// Get single case service by ID
router.get(
  '/:id',
  validateObjectId('id'),
  hasPermission('caseService', 'readAny'),
  CaseServiceController.getCaseServiceById
);

// Get all case services with filtering, pagination, search, and sorting
router.get(
  '/',
  validateQuery(caseServiceQuerySchema),
  hasPermission('caseService', 'readAny'),
  CaseServiceController.getAllCaseServices
);

// Update a case service
router.put(
  '/:id',
  validateObjectId('id'),
  validateSchema(caseServiceUpdateSchema),
  hasPermission('caseService', 'updateAny'),
  CaseServiceController.updateCaseService
);

// Delete multiple case services
router.delete(
  '/bulk',
  validateSchema(caseServiceBulkDeleteSchema),
  hasPermission('caseService', 'deleteAny'),
  CaseServiceController.bulkDeleteCaseServices
);

router.get(
  '/:id/overview',
  validateObjectId('id'),
  hasPermission('caseService', 'readAny'),
  CaseServiceController.getCaseServiceOverview
);

router.post(
  '/:id/installments',
  validateObjectId('id'),
  validateSchema(createInstallmentSchema),
  hasPermission('caseService', 'updateAny'),
  CaseServiceController.createInstallment
);

router.post(
  '/:id/participants',
  validateObjectId('id'),
  validateSchema(addParticipantSchema),
  hasPermission('caseService', 'updateAny'),
  CaseServiceController.addParticipant
);

router.post(
  '/:id/payments',
  validateObjectId('id'),
  validateSchema(addPaymentSchema),
  hasPermission('caseService', 'updateAny'),
  CaseServiceController.addPayment
);

// Update case service participants
router.patch(
  '/:id',
  validateObjectId('id'),
  hasPermission('caseService', 'updateAny'),
  CaseServiceController.patchCaseService
);

module.exports = router;
