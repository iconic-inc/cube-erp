import { Router } from 'express';
import { CaseServiceController } from '@controllers/caseService.controller';
import { authenticationV2 } from '@middlewares/authentication';
import { hasPermission } from '@middlewares/authorization';
import multer from 'multer';
import { fileFilter, storage } from '@configs/config.multer';
import { validateObjectId } from '@schemas/index';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: storage('case-service-imports'),
  fileFilter: fileFilter(['csv', 'xlsx', 'xls']),
}).single('file');

// Require authentication for all routes
router.use(authenticationV2);

// Define the routes
// Export case services to CSV
router.get(
  '/export/csv',
  hasPermission('caseService', 'readAny'),
  CaseServiceController.exportCaseServicesToCSV
);

// Export case services to XLSX
router.get(
  '/export/xlsx',
  hasPermission('caseService', 'readAny'),
  CaseServiceController.exportCaseServicesToXLSX
);

// attach documents to case services
router.post(
  '/:id/documents',
  validateObjectId('id'),
  hasPermission('caseService', 'updateAny'),
  CaseServiceController.attachToCase
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
  hasPermission('caseService', 'readAny'),
  CaseServiceController.getAllCaseServices
);

// Update a case service
router.put(
  '/:id',
  validateObjectId('id'),
  hasPermission('caseService', 'updateAny'),
  CaseServiceController.updateCaseService
);

// Delete a case service
router.delete(
  '/:id',
  validateObjectId('id'),
  hasPermission('caseService', 'deleteAny'),
  CaseServiceController.deleteCaseService
);

module.exports = router;
