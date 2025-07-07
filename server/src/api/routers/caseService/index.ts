import { Router } from 'express';
import { CaseServiceController } from '@controllers/caseService.controller';
import { authenticationV2 } from '@middlewares/authentication';
import { hasPermission } from '@middlewares/authorization';
import multer from 'multer';
import { fileFilter, storage } from '@configs/config.multer';
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
  documentIdsSchema,
  caseDocumentIdsSchema,
} from '@schemas/caseService.schema';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: storage('case-service-imports'),
  fileFilter: fileFilter(['csv', 'xlsx', 'xls']),
}).single('file');

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

// Import case services from CSV or XLSX
router.post(
  '/import',
  hasPermission('caseService', 'createAny'),
  upload,
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

module.exports = router;
