import { Router } from 'express';
import { authenticationV2 } from '@middlewares/authentication';
import { hasPermission } from '@middlewares/authorization';
import { DocumentController } from '../../controllers/document.controller';
import { validateObjectId } from '@schemas/index';
import { diskDocStorage } from '@configs/config.multer';

const router = Router();

// Require authentication for all routes
router.use(authenticationV2);

/**
 * @route GET /api/documents/:id
 * @desc Get document by ID
 * @access Private
 */
router.get(
  '/:id',
  validateObjectId('id'),
  hasPermission('document', 'readAny'),
  DocumentController.getDocumentById
);

/**
 * @route GET /api/documents
 * @desc Get all documents (with permissions)
 * @access Private
 */
router.get(
  '/',
  hasPermission('document', 'readAny'),
  DocumentController.getDocuments
);

/**
 * @route POST /api/documents
 * @desc Upload a new document
 * @access Private
 */
router.post(
  '/',
  hasPermission('document', 'createAny'),
  diskDocStorage.array('documents'),
  DocumentController.uploadDocument
);

/**
 * @route PUT /api/documents/:id/access
 * @desc Update document access permissions
 * @access Private
 */
router.put(
  '/:id/access',
  hasPermission('document', 'updateAny'),
  DocumentController.updateAccessRights
);

/**
 * @route PUT /api/documents/:id
 * @desc Update document metadata
 * @access Private
 */
router.put(
  '/:id',
  validateObjectId('id'),
  hasPermission('document', 'updateAny'),
  DocumentController.updateDocument
);

/**
 * @route DELETE /api/documents/bulk
 * @desc Bulk delete documents
 * @access Private
 */
router.delete(
  '/bulk',
  hasPermission('document', 'deleteAny'),
  DocumentController.deleteMultipleDocuments
);

/**
 * @route DELETE /api/documents/:id
 * @desc Delete a document
 * @access Private
 */
router.delete(
  '/:id',
  validateObjectId('id'),
  hasPermission('document', 'deleteAny'),
  DocumentController.deleteDocument
);

module.exports = router;
