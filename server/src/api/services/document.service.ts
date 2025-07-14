import mongoose, { isValidObjectId, Types } from 'mongoose';
import { BadRequestError, NotFoundError } from '../core/errors';
import { DocumentModel } from '../models/document.model';
import { DocumentCaseModel } from '../models/documentCase.model';
import {
  IDocumentCreate,
  IDocumentQuery,
} from '../interfaces/document.interface';
import fs from 'fs';
import {
  formatAttributeName,
  getImageUrl,
  getReturnData,
  getReturnList,
} from '@utils/index';
import { getEmployeeByUserId } from './employee.service';
import { DOCUMENT } from '@constants/document.constant';
import { USER } from '@constants/user.constant';

/**
 * Create a new document
 * @param {Express.Multer.File[]} files - Uploaded file
 */
export const createDocument = async (
  files: Express.Multer.File[],
  userId: string
) => {
  if (!files || !files.length) {
    throw new BadRequestError('No file uploaded');
  }
  try {
    const employee = await getEmployeeByUserId(userId);

    const newDocs = [];
    for (const file of files) {
      // Create document record in database
      const document = await DocumentModel.build({
        createdBy: employee.id,
        name: file.filename,
        whiteList: [employee.id],
        url: getImageUrl(`documents/${file.filename}`),
        isPublic: false,
      });
      newDocs.push(document);
    }

    return getReturnList(newDocs);
  } catch (error: any) {
    // If there's an error, clean up the uploaded file
    if (files?.length) {
      try {
        for (const file of files) {
          fs.unlinkSync(file.path);
        }
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    throw error;
  }
};

/**
 * Get all documents
 * @param {string} userId - ID of the employee making the request
 * @param {IDocumentQuery} query - Query parameters for filtering documents
 */
export const getDocuments = async (
  userId: string,
  query: IDocumentQuery = {}
) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy,
      sortOrder,
      type,
      startDate,
      endDate,
      isPublic,
      createdBy,
    } = query;

    const employee = await getEmployeeByUserId(userId);
    const employeeId = employee.id;

    // Build the aggregation pipeline
    const pipeline: any[] = [];

    // Stage 1: Initial match for access permissions
    pipeline.push({
      $match: {
        $or: [
          { doc_isPublic: true },
          { doc_createdBy: new mongoose.Types.ObjectId(employeeId) },
          { doc_whiteList: { $in: [new mongoose.Types.ObjectId(employeeId)] } },
        ],
      },
    });

    // Stage 2: Lookup to populate creator information
    pipeline.push({
      $lookup: {
        from: USER.EMPLOYEE.COLLECTION_NAME,
        localField: 'doc_createdBy',
        foreignField: '_id',
        as: 'doc_createdBy',
      },
    });

    // Stage 3: Unwind createdBy array
    pipeline.push({
      $unwind: {
        path: '$doc_createdBy',
        preserveNullAndEmptyArrays: true,
      },
    });

    // Stage 3.1: Lookup to populate user information for creator
    pipeline.push({
      $lookup: {
        from: USER.COLLECTION_NAME,
        localField: 'doc_createdBy.emp_user',
        foreignField: '_id',
        as: 'doc_createdBy.emp_user',
      },
    });

    // Stage 3.2: Unwind the user array
    pipeline.push({
      $unwind: {
        path: '$doc_createdBy.emp_user',
        preserveNullAndEmptyArrays: true,
      },
    });

    // Stage 4: Lookup to populate whitelist information
    pipeline.push({
      $lookup: {
        from: USER.EMPLOYEE.COLLECTION_NAME,
        localField: 'doc_whiteList',
        foreignField: '_id',
        as: 'doc_whiteList',
      },
    });

    // Stage 4.1: Lookup to populate user information for whitelist employees
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'doc_whiteList.emp_user',
        foreignField: '_id',
        as: 'whitelistUsers',
      },
    });

    // Stage 4.2: Add user information to each employee in whitelist
    pipeline.push({
      $addFields: {
        doc_whiteList: {
          $map: {
            input: '$doc_whiteList',
            as: 'employee',
            in: {
              $mergeObjects: [
                '$$employee',
                {
                  emp_user: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: '$whitelistUsers',
                          as: 'user',
                          cond: { $eq: ['$$user._id', '$$employee.emp_user'] },
                        },
                      },
                      0,
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    });

    // Stage 4.3: Remove the temporary whitelist users array
    pipeline.push({
      $project: {
        whitelistUsers: 0,
      },
    });

    // Stage 5: Apply search filter if provided
    if (search) {
      const searchRegex = new RegExp(search, 'i'); // Case-insensitive search
      pipeline.push({
        $match: {
          $or: [
            { doc_name: searchRegex },
            { doc_description: searchRegex },
            { doc_type: searchRegex },
            {
              doc_createdBy: {
                emp_code: searchRegex,
                emp_user: {
                  usr_firstName: searchRegex,
                  usr_lastName: searchRegex,
                },
              },
            },
          ],
        },
      });
    }

    // Stage 6: Filter by document type if provided
    if (type) {
      pipeline.push({
        $match: { doc_type: type },
      });
    }
    if (isPublic) {
      pipeline.push({
        $match: { doc_isPublic: isPublic === 'true' },
      });
    }
    if (createdBy && isValidObjectId(createdBy)) {
      pipeline.push({
        $match: { 'doc_createdBy._id': new mongoose.Types.ObjectId(createdBy) },
      });
    }

    // Stage 7: Filter by date range if provided
    if (startDate || endDate) {
      const dateFilter: any = {};

      if (startDate) {
        dateFilter.$gte = new Date(startDate);
      }

      if (endDate) {
        dateFilter.$lte = new Date(endDate);
      }

      pipeline.push({
        $match: { createdAt: dateFilter },
      });
    }

    // Stage 8: Project to include only necessary fields
    pipeline.push({
      $project: {
        _id: 1,
        doc_name: 1,
        doc_type: 1,
        doc_description: 1,
        doc_url: 1,
        doc_isPublic: 1,
        createdAt: 1,
        updatedAt: 1,
        doc_createdBy: {
          _id: 1,
          emp_code: 1,
          emp_position: 1,
          emp_user: {
            _id: 1,
            usr_firstName: 1,
            usr_lastName: 1,
            usr_email: 1,
            usr_username: 1,
            usr_msisdn: 1,
            usr_avatar: 1,
            usr_status: 1,
            usr_role: 1,
          },
        },
        doc_whiteList: {
          _id: 1,
          emp_code: 1,
          emp_position: 1,
          emp_user: {
            _id: 1,
            usr_firstName: 1,
            usr_lastName: 1,
            usr_email: 1,
            usr_username: 1,
          },
        },
      },
    });

    // Stage 9: Sort the results
    const sortField = sortBy || 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    pipeline.push({
      $sort: { [sortField]: sortDirection },
    });

    // Get total count first (for pagination)
    const countPipeline = [...pipeline]; // Clone the pipeline
    countPipeline.push({ $count: 'total' });
    const countResult = await DocumentModel.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Stage 10: Apply pagination
    pipeline.push({ $skip: (page - 1) * limit });
    pipeline.push({ $limit: +limit });

    // Execute the aggregation
    const documents = await DocumentModel.aggregate(pipeline);
    const totalPages = Math.ceil(total / limit);

    return {
      data: getReturnList(documents),
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get document by ID
 * @param {string} documentId - Document ID
 * @param {string} employeeId - ID of the employee making the request
 */
export const getDocumentById = async (documentId: string, userId: string) => {
  try {
    if (!Types.ObjectId.isValid(documentId)) {
      throw new BadRequestError('Yêu cầu không hợp lệ.');
    }

    const employee = await getEmployeeByUserId(userId);
    const employeeId = employee.id;

    const document = await DocumentModel.findById(documentId)
      .populate({
        path: 'doc_createdBy',
        select: 'emp_user emp_code emp_position',
        populate: {
          path: 'emp_user',
          select:
            'usr_firstName usr_lastName usr_email usr_username usr_msisdn usr_avatar usr_status usr_role',
        },
      })
      .populate({
        path: 'doc_whiteList',
        select: 'emp_user emp_code emp_position',
        populate: {
          path: 'emp_user',
          select: 'usr_firstName usr_lastName usr_email usr_username',
        },
      });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    // Check if user has access to this document
    const hasAccess =
      document.doc_isPublic ||
      document.doc_createdBy._id.toString() === employeeId ||
      document.doc_whiteList.some((emp) => emp._id.toString() === employeeId);

    if (!hasAccess) {
      throw new NotFoundError('Bạn không có quyền truy cập tài liệu này.');
    }

    return getReturnData(document);
  } catch (error) {
    throw error;
  }
};

/**
 * Update document metadata
 * @param {string} documentId - Document ID
 * @param {Partial<IDocumentCreate>} updateData - Updated document data
 * @param {string} employeeId - ID of the employee making the request
 */
export const updateDocument = async (
  documentId: string,
  updateData: Partial<IDocumentCreate>,
  userId: string
) => {
  if (!Types.ObjectId.isValid(documentId)) {
    throw new BadRequestError('Yêu cầu không hợp lệ.');
  }

  const document = await DocumentModel.findById(documentId);

  if (!document) {
    throw new NotFoundError('Không tìm thấy tài liệu');
  }

  const employee = await getEmployeeByUserId(userId);

  // Only creator can update document metadata
  const isOwner = document.doc_createdBy.toString() === employee.id;
  const isWhileListed =
    document.doc_whiteList.some((id) => id.toString() === employee.id) ||
    document.doc_isPublic;
  if (!isOwner && !isWhileListed) {
    throw new BadRequestError('Bạn không có quyền cập nhật tài liệu này');
  }

  const updatedDocument = await DocumentModel.findByIdAndUpdate(
    documentId,
    formatAttributeName(updateData, DOCUMENT.PREFIX),
    {
      new: true,
      runValidators: true,
    }
  );
  if (!updatedDocument) {
    throw new NotFoundError('Không tìm thấy tài liệu để cập nhật');
  }

  return getReturnData(updatedDocument);
};

/**
 * Delete document
 * @param {string} documentId - Document ID
 * @param {string} employeeId - ID of the employee making the request
 */
export const deleteDocument = async (
  documentId: string,
  employeeId: string
) => {
  try {
    if (!Types.ObjectId.isValid(documentId)) {
      throw new BadRequestError('Invalid document ID');
    }

    const document = await DocumentModel.findById(documentId);

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    // Only creator can delete document
    if (document.doc_createdBy.toString() !== employeeId) {
      throw new BadRequestError(
        'You do not have permission to delete this document'
      );
    }

    // Delete file from disk
    try {
      fs.unlinkSync(`public/uploads/${document.doc_url.split('/').pop()}`);
    } catch (unlinkError) {
      console.error('Error deleting file:', unlinkError);
      // Continue with document deletion even if file deletion fails
    }

    // Delete document from database
    await document.deleteOne();

    return { message: 'Document deleted successfully' };
  } catch (error) {
    throw error;
  }
};

export const deleteMultipleDocuments = async (
  documentIds: string[],
  userId: string
) => {
  if (!Array.isArray(documentIds)) {
    throw new BadRequestError('Yêu cầu không hợp lệ.');
  }
  const validIds = documentIds.filter((id) => Types.ObjectId.isValid(id));
  if (!validIds.length) {
    throw new BadRequestError('Yêu cầu không hợp lệ.');
  }

  const employee = await getEmployeeByUserId(userId);
  const documents = await DocumentModel.find({
    _id: { $in: validIds },
    doc_createdBy: employee.id,
  });
  if (!documents.length) {
    throw new NotFoundError('Không tìm thấy tài liệu nào để xóa.');
  }

  // Delete files from disk
  for (const document of documents) {
    try {
      fs.unlinkSync(
        `public/uploads/documents/${document.doc_url.split('/').pop()}`
      );
    } catch (unlinkError) {
      console.error('Error deleting file:', unlinkError);
      // Continue with document deletion even if file deletion fails
    }
    // Delete document from database
    await document.deleteOne();
  }
  await DocumentCaseModel.deleteMany({
    document: { $in: validIds },
  });
  return getReturnData({
    message: 'Documents deleted successfully',
    deletedCount: documents.length,
  });
};

/**
 * Update document access permissions
 * @param {string} documentId - Document ID
 * @param {string[]} whiteList - Array of employee IDs allowed to access the document
 * @param {boolean} isPublic - Whether the document is public
 * @param {string} employeeId - ID of the employee making the request
 */
export const updateDocumentAccess = async (
  documentId: string,
  whiteList: string[],
  isPublic: boolean,
  employeeId: string
) => {
  try {
    if (!Types.ObjectId.isValid(documentId)) {
      throw new BadRequestError('Invalid document ID');
    }

    const document = await DocumentModel.findById(documentId);

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    // Only creator can update access permissions
    if (document.doc_createdBy.toString() !== employeeId) {
      throw new BadRequestError(
        'You do not have permission to update access for this document'
      );
    }

    // Validate employee IDs in whitelist
    const validIds = whiteList.filter((id) => Types.ObjectId.isValid(id));

    // Update document access
    document.doc_whiteList = validIds.map(
      (id) => new mongoose.Schema.Types.ObjectId(id)
    );
    document.doc_isPublic = isPublic;

    await document.save();

    return { message: 'Document access updated successfully' };
  } catch (error) {
    throw error;
  }
};
