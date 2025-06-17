import { Request, Response, NextFunction } from 'express';
import { OK } from '@/api/core/success.response';
import { BadRequestError, NotFoundError } from '../core/errors';
import * as DocumentService from '../services/document.service';

export class DocumentController {
  /**
   * Get all documents (with permissions)
   */
  static getDocuments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    return OK({
      res,
      metadata: await DocumentService.getDocuments(req.user.userId, req.query),
      message: 'Documents retrieved successfully',
      link: {
        self: { href: '/documents', method: 'GET' },
        upload: { href: '/documents', method: 'POST' },
        update: { href: '/documents/:id', method: 'PUT' },
        delete: { href: '/documents/:id', method: 'DELETE' },
      },
    });
  };

  /**
   * Get document by ID
   */
  static getDocumentById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user.userId;
      if (!userId) {
        throw new BadRequestError('User ID is required');
      }

      const documentId = req.params.id;
      const document = await DocumentService.getDocumentById(
        documentId,
        userId
      );

      return OK({
        res,
        metadata: document,
        message: 'Document retrieved successfully',
        link: {
          self: { href: `/documents/${documentId}`, method: 'GET' },
          update: { href: `/documents/${documentId}`, method: 'PUT' },
          delete: { href: `/documents/${documentId}`, method: 'DELETE' },
          access: { href: `/documents/${documentId}/access`, method: 'PUT' },
          attachToCase: {
            href: `/documents/${documentId}/case/:caseId`,
            method: 'POST',
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Upload a new document
   */
  static uploadDocument = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await DocumentService.createDocument(
        req.files as Express.Multer.File[],
        req.user.userId
      );

      return OK({
        res,
        metadata: result,
        message: 'Document uploaded successfully',
        link: {
          self: { href: `/documents/${result.id}`, method: 'GET' },
          update: { href: `/documents/${result.id}`, method: 'PUT' },
          delete: { href: `/documents/${result.id}`, method: 'DELETE' },
          access: { href: `/documents/${result.id}/access`, method: 'PUT' },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update document metadata
   */
  static updateDocument = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user.userId;
      if (!userId) {
        throw new BadRequestError('User ID is required');
      }

      const documentId = req.params.id;
      const updateData = req.body;

      const result = await DocumentService.updateDocument(
        documentId,
        updateData,
        userId
      );

      return OK({
        res,
        metadata: result,
        message: 'Document updated successfully',
        link: {
          self: { href: `/documents/${documentId}`, method: 'GET' },
          delete: { href: `/documents/${documentId}`, method: 'DELETE' },
          access: { href: `/documents/${documentId}/access`, method: 'PUT' },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a document
   */
  static deleteDocument = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user.userId;
      if (!userId) {
        throw new BadRequestError('User ID is required');
      }

      const documentId = req.params.id;

      const result = await DocumentService.deleteDocument(documentId, userId);

      return OK({
        res,
        metadata: result,
        message: 'Document deleted successfully',
        link: {
          documents: { href: '/documents', method: 'GET' },
          upload: { href: '/documents', method: 'POST' },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Bulk delete documents
   */
  static deleteMultipleDocuments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const userId = req.user.userId;
    if (!userId) {
      throw new BadRequestError('User ID is required');
    }
    const { documentIds } = req.body;
    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      throw new BadRequestError('Document IDs must be an array and not empty');
    }
    const result = await DocumentService.deleteMultipleDocuments(
      documentIds,
      userId
    );

    return OK({
      res,
      metadata: result,
      message: 'Documents deleted successfully',
      link: {
        self: { href: '/documents', method: 'GET' },
        upload: { href: '/documents', method: 'POST' },
      },
    });
  };

  /**
   * Attach document to a case service
   */
  static attachToCase = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user.userId;
      if (!userId) {
        throw new BadRequestError('User ID is required');
      }

      const documentId = req.params.id;
      const caseId = req.params.caseId;

      const result = await DocumentService.attachDocumentToCase(
        documentId,
        caseId,
        userId
      );

      return OK({
        res,
        metadata: result,
        message: 'Document attached to case successfully',
        link: {
          document: { href: `/documents/${documentId}`, method: 'GET' },
          caseDocuments: { href: `/documents/case/${caseId}`, method: 'GET' },
          detach: {
            href: `/documents/${documentId}/case/${caseId}`,
            method: 'DELETE',
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Detach document from a case service
   */
  static detachFromCase = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user.userId;
      if (!userId) {
        throw new BadRequestError('User ID is required');
      }

      const documentId = req.params.id;
      const caseId = req.params.caseId;

      const result = await DocumentService.detachDocumentFromCase(
        documentId,
        caseId,
        userId
      );

      return OK({
        res,
        metadata: result,
        message: 'Document detached from case successfully',
        link: {
          document: { href: `/documents/${documentId}`, method: 'GET' },
          caseDocuments: { href: `/documents/case/${caseId}`, method: 'GET' },
          attach: {
            href: `/documents/${documentId}/case/${caseId}`,
            method: 'POST',
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update document access permissions
   */
  static updateAccessRights = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user.userId;
      if (!userId) {
        throw new BadRequestError('User ID is required');
      }

      const documentId = req.params.id;
      const { whiteList, isPublic } = req.body;

      const result = await DocumentService.updateDocumentAccess(
        documentId,
        whiteList || [],
        isPublic || false,
        userId
      );

      return OK({
        res,
        metadata: result,
        message: 'Document access rights updated successfully',
        link: {
          document: { href: `/documents/${documentId}`, method: 'GET' },
          update: { href: `/documents/${documentId}`, method: 'PUT' },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all documents for a specific case
   */
  static getDocumentsByCase = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user.userId;
      if (!userId) {
        throw new BadRequestError('User ID is required');
      }

      const caseId = req.params.caseId;

      const result = await DocumentService.getDocumentsByCase(caseId, userId);

      return OK({
        res,
        metadata: result.data,
        message: 'Case documents retrieved successfully',
        link: {
          self: { href: `/documents/case/${caseId}`, method: 'GET' },
          allDocuments: { href: '/documents', method: 'GET' },
          uploadDocument: { href: '/documents', method: 'POST' },
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
