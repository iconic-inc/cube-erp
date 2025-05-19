import { Router } from 'express';
import { CaseServiceController } from '@controllers/caseService.controller';
import { authenticationV2 } from '@middlewares/authentication';
import { hasPermission } from '@middlewares/authorization';
import multer from 'multer';
import { fileFilter, storage } from '@configs/config.multer';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: storage('case-service-imports'),
  fileFilter: fileFilter(['csv', 'xlsx', 'xls']),
}).single('file');

// Require authentication for all routes
router.use(authenticationV2);

// Define the routes
// Get all case services with filtering, pagination, search, and sorting
router.get(
  '/',
  hasPermission('caseService', 'readAny'),
  CaseServiceController.getAllCaseServices
);

// Create a new case service
router.post(
  '/',
  hasPermission('caseService', 'createAny'),
  CaseServiceController.createCaseService
);

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

// Import case services from CSV or XLSX
router.post(
  '/import',
  hasPermission('caseService', 'createAny'),
  upload,
  CaseServiceController.importCaseServices
);

// Get single case service by ID
router.get(
  '/:id',
  hasPermission('caseService', 'readAny'),
  CaseServiceController.getCaseServiceById
);

// Update a case service
router.put(
  '/:id',
  hasPermission('caseService', 'updateAny'),
  CaseServiceController.updateCaseService
);

// Delete a case service
router.delete(
  '/:id',
  hasPermission('caseService', 'deleteAny'),
  CaseServiceController.deleteCaseService
);

module.exports = router;
