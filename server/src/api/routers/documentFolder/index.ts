import { Router } from 'express';
import { authenticationV2 } from '@middlewares/authentication';
import { hasPermission } from '@middlewares/authorization';
import { validateObjectId } from '@schemas/index';
import { DocumentFolderController } from '@controllers/documentFolder.controller';

const router = Router();

// Require authentication for all routes
router.use(authenticationV2);

/**
 * @route GET /api/document-folders
 * @desc Get all document-folders(with permissions)
 * @access Private
 */
router.get(
  '/',
  // hasPermission('documentFolder', 'readAny'),
  DocumentFolderController.getDocumentFolders
);

/**
 * @route GET /api/document-folders/:id
 * @desc Get document folder by ID
 * @access Private
 */
router.get(
  '/:id',
  validateObjectId('id'),
  // hasPermission('documentFolder', 'readAny'),
  DocumentFolderController.getDocumentFolderById
);

/**
 * @route POST /api/document-folders
 * @desc Upload a new document
 * @access Private
 */
router.post(
  '/',
  // hasPermission('documentFolder', 'createAny'),
  DocumentFolderController.createDocumentFolder
);

/**
 * @route PUT /api/document-folders/:id
 * @desc Update document metadata
 * @access Private
 */
router.put(
  '/:id',
  validateObjectId('id'),
  // hasPermission('documentFolder', 'updateAny'),
  DocumentFolderController.updateDocumentFolder
);

/**
 * @route DELETE /api/document-folders/bulk
 * @desc Delete multiple document folders
 * @access Private
 */
router.delete(
  '/bulk',
  // hasPermission('documentFolder', 'deleteAny'),
  DocumentFolderController.bulkDeleteFolders
);

/**
 * @route DELETE /api/document-folders/:id
 * @desc Delete a document
 * @access Private
 */
router.delete(
  '/:id',
  validateObjectId('id'),
  // hasPermission('documentFolder', 'deleteAny'),
  DocumentFolderController.deleteDocumentFolder
);

module.exports = router;
