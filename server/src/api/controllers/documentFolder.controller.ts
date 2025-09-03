import { Request, Response, NextFunction } from 'express';
import { OK } from '@/api/core/success.response';
import { BadRequestError, NotFoundError } from '../core/errors';
import * as DocumentFolderService from '../services/documentFolder.service';

export class DocumentFolderController {
  /**
   * Get all document-folders (with permissions)
   */
  static getDocumentFolders = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    return OK({
      res,
      metadata: await DocumentFolderService.getFolders(
        req.user.userId,
        req.query
      ),
      message: 'DocumentFolders retrieved successfully',
      link: {
        self: { href: '/document-folders', method: 'GET' },
        upload: { href: '/document-folders', method: 'POST' },
        update: { href: '/document-folders/:id', method: 'PUT' },
        delete: { href: '/document-folders/:id', method: 'DELETE' },
      },
    });
  };

  /**
   * Get document folder by ID
   */
  static getDocumentFolderById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const folderId = req.params.id;
    if (!folderId) {
      throw new BadRequestError('Folder ID is required');
    }

    const result = await DocumentFolderService.getFolderById(folderId);
    if (!result) {
      throw new NotFoundError('DocumentFolder not found');
    }

    return OK({
      res,
      metadata: result,
      message: 'DocumentFolder retrieved successfully',
      link: {
        self: { href: `/document-folders/${folderId}`, method: 'GET' },
        update: { href: `/document-folders/${folderId}`, method: 'PUT' },
        delete: { href: `/document-folders/${folderId}`, method: 'DELETE' },
      },
    });
  };

  /**
   * Update document metadata
   */
  static updateDocumentFolder = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const userId = req.user.userId;
    if (!userId) {
      throw new BadRequestError('User ID is required');
    }

    const folderId = req.params.id;
    const updateData = req.body;

    const result = await DocumentFolderService.updateFolder(
      folderId,
      updateData
    );

    return OK({
      res,
      metadata: result,
      message: 'DocumentFolder updated successfully',
      link: {
        self: { href: `/document-folders/${folderId}`, method: 'GET' },
        delete: { href: `/document-folders/${folderId}`, method: 'DELETE' },
        access: { href: `/document-folders/${folderId}/access`, method: 'PUT' },
      },
    });
  };

  /**
   * Delete a document
   */
  static deleteDocumentFolder = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const userId = req.user.userId;
    if (!userId) {
      throw new BadRequestError('User ID is required');
    }

    const folderId = req.params.id;

    const result = await DocumentFolderService.deleteFolder(folderId);

    return OK({
      res,
      metadata: result,
      message: 'DocumentFolder deleted successfully',
      link: {
        folders: { href: '/document-folders', method: 'GET' },
        upload: { href: '/document-folders', method: 'POST' },
      },
    });
  };

  static createDocumentFolder = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const userId = req.user.userId;
    if (!userId) {
      throw new BadRequestError('User ID is required');
    }

    const folderData = req.body;

    const result = await DocumentFolderService.createFolder(folderData, userId);

    return OK({
      res,
      metadata: result,
      message: 'DocumentFolder created successfully',
      link: {
        self: { href: `/document-folders/${result.id}`, method: 'GET' },
        update: { href: `/document-folders/${result.id}`, method: 'PUT' },
        delete: { href: `/document-folders/${result.id}`, method: 'DELETE' },
      },
    });
  };

  static bulkDeleteFolders = async (req: Request, res: Response) => {
    const folderIds = JSON.parse(req.body.folderIds || '[]');
    if (!Array.isArray(folderIds)) {
      throw new BadRequestError('Invalid folder IDs');
    }

    const result = await DocumentFolderService.bulkDeleteFolders(folderIds);
    return OK({
      res,
      metadata: result,
      message: 'DocumentFolders deleted successfully',
      link: {
        self: { href: '/document-folders/bulk', method: 'DELETE' },
      },
    });
  };
}
