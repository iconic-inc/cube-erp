import { Request, Response } from 'express';
import { BadRequestError } from '../core/errors';
import fs from 'fs';
import { OK } from '../core/success.response';
import {
  createCaseService,
  deleteCaseService,
  getCaseServiceById,
  updateCaseService,
  exportCaseServicesToXLSX,
  importCaseServices,
  getCaseServices,
  bulkDeleteCaseServices,
  getCaseServiceDocuments,
  detachDocumentFromCase,
  attachDocumentToCase,
  getCaseServiceTasks,
} from '@services/caseService.service';

export class CaseServiceController {
  /**
   * Get all case services with filtering, pagination, sorting, and search
   */
  static async getAllCaseServices(req: Request, res: Response) {
    return OK({
      res,
      message: 'Case services fetched successfully',
      metadata: await getCaseServices(req.query),
    });
  }

  /**
   * Get a case service by ID
   */
  static async getCaseServiceById(req: Request, res: Response) {
    return OK({
      res,
      message: 'Case service fetched successfully',
      metadata: await getCaseServiceById(req.params.id),
    });
  }

  /**
   * Create a new case service
   */
  static async createCaseService(req: Request, res: Response) {
    return OK({
      res,
      message: 'Case service created successfully',
      metadata: await createCaseService(req.body),
    });
  }

  /**
   * Update a case service
   */
  static async updateCaseService(req: Request, res: Response) {
    return OK({
      res,
      message: 'Case service updated successfully',
      metadata: await updateCaseService(req.params.id, req.body),
    });
  }

  /**
   * Bulk delete case services
   */
  static async bulkDeleteCaseServices(req: Request, res: Response) {
    return OK({
      res,
      message: 'Case services deleted successfully',
      metadata: await bulkDeleteCaseServices(req.body.caseServiceIds), // body is already validated using zod in routes
    });
  }

  /**
   * Export case services to XLSX
   */
  static async exportCaseServicesToXLSX(req: Request, res: Response) {
    return OK({
      res,
      message: 'Case services exported successfully',
      metadata: await exportCaseServicesToXLSX(req.query),
    });
  }

  /**
   * Import case services from XLSX
   */
  static async importCaseServices(req: Request, res: Response) {
    // Get the file path
    const filePath = req.file?.path;
    if (!filePath) {
      throw new BadRequestError('File not found');
    }

    try {
      // Parse import options from request body
      const options = {
        skipDuplicates: req.body.skipDuplicates === 'true',
        updateExisting: req.body.updateExisting === 'true',
        skipEmptyRows: req.body.skipEmptyRows !== 'false', // Default to true
      };

      // Import case services from the uploaded file
      const result = await importCaseServices(filePath, options);

      return OK({
        res,
        message: 'Case services imported successfully',
        metadata: result,
      });
    } catch (error) {
      throw error;
    } finally {
      // Always delete the file after processing
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }
  }

  /**
   * Attach document to a case service
   */
  static attachDocToCase = async (req: Request, res: Response) => {
    const userId = req.user.userId;
    if (!userId) {
      throw new BadRequestError('User ID is required');
    }

    const documentIds = req.body.documentIds as string[];
    const caseId = req.params.caseId;

    const result = await attachDocumentToCase(documentIds, caseId, userId);

    return OK({
      res,
      metadata: result,
      message: 'Document attached to case successfully',
      link: {
        caseDocuments: {
          href: `/case-services/${caseId}/documents`,
          method: 'GET',
        },
        detach: {
          href: `/case-services/${caseId}/documents`,
          method: 'DELETE',
        },
      },
    });
  };
  /**
   * Detach document from a case service
   */
  static detachDocFromCase = async (req: Request, res: Response) => {
    const userId = req.user.userId;
    if (!userId) {
      throw new BadRequestError('User ID is required');
    }

    const caseDocumentIds = req.body.caseDocumentIds as string[];
    const caseId = req.params.caseId;

    const result = await detachDocumentFromCase(caseDocumentIds, caseId);

    return OK({
      res,
      metadata: result,
      message: 'Document detached from case successfully',
      link: {
        caseDocuments: {
          href: `/case-services/${caseId}/documents`,
          method: 'GET',
        },
        attach: {
          href: `/case-services/${caseId}/documents`,
          method: 'POST',
        },
      },
    });
  };

  static getCaseServiceDocuments = async (req: Request, res: Response) => {
    const documents = await getCaseServiceDocuments(
      req.params.id,
      req.user.userId,
      req.query
    );
    return OK({
      res,
      message: 'Documents fetched successfully',
      metadata: documents,
    });
  };

  static getCaseServiceTasks = async (req: Request, res: Response) => {
    const tasks = await getCaseServiceTasks(req.params.id);
    return OK({
      res,
      message: 'Tasks fetched successfully',
      metadata: tasks,
    });
  };

  /**
   * Get case services by employee user ID
   */
  static getCaseServicesByEmployee = async (req: Request, res: Response) => {
    const caseServices = await getCaseServices({
      ...req.query,
      employeeUserId: req.user.userId,
    });
    return OK({
      res,
      message: 'Case services fetched successfully',
      metadata: caseServices,
    });
  };
}
