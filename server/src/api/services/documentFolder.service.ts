import mongoose, { isValidObjectId } from 'mongoose';
import { DocumentFolderModel } from '@models/documentFolder.model';
import {
  IDocumentFolderCreate,
  IDocumentFolderQuery,
} from '../interfaces/documentFolder.interface';
import {
  getReturnData,
  getReturnList,
  formatAttributeName,
} from '@utils/index';
import { getEmployeeByUserId } from './employee.service';
import { getDocuments } from './document.service';
import { DocumentModel } from '@models/document.model';
import { DOCUMENT_FOLDER } from '@constants/documentFolder.constant';
import { USER } from '@constants/user.constant';
import { BadRequestError, NotFoundError } from '../core/errors';

const createFolder = async function (
  payload: IDocumentFolderCreate,
  userId: string
) {
  const employee = await getEmployeeByUserId(userId);
  const folder = await DocumentFolderModel.build({
    ...payload,
    owner: employee.id,
  });
  return getReturnData(folder);
};

/**
 * Get all folders with advanced filtering and pagination
 * @param {string} userId - ID of the user making the request
 * @param {IDocumentFolderQuery} query - Query parameters for filtering folders
 */
const getFolders = async function (
  userId: string,
  query: IDocumentFolderQuery = {}
) {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy,
      sortOrder,
      startDate,
      endDate,
      owner,
    } = query;

    const employee = await getEmployeeByUserId(userId);
    const employeeId = employee.id;

    // Build the aggregation pipeline
    const pipeline: any[] = [];

    // Stage 1: Lookup to populate owner information
    pipeline.push({
      $lookup: {
        from: USER.EMPLOYEE.COLLECTION_NAME,
        localField: 'fol_owner',
        foreignField: '_id',
        as: 'fol_owner',
      },
    });

    // Stage 2: Unwind owner array
    pipeline.push({
      $unwind: {
        path: '$fol_owner',
        preserveNullAndEmptyArrays: true,
      },
    });

    // Stage 3: Lookup to populate user information for owner
    pipeline.push({
      $lookup: {
        from: USER.COLLECTION_NAME,
        localField: 'fol_owner.emp_user',
        foreignField: '_id',
        as: 'fol_owner.emp_user',
      },
    });

    // Stage 4: Unwind the user array
    pipeline.push({
      $unwind: {
        path: '$fol_owner.emp_user',
        preserveNullAndEmptyArrays: true,
      },
    });

    // Stage 5: Apply search filter if provided
    if (search) {
      const searchRegex = new RegExp(search, 'i'); // Case-insensitive search
      pipeline.push({
        $match: {
          $or: [
            { fol_name: searchRegex },
            { 'fol_owner.emp_code': searchRegex },
            { 'fol_owner.emp_user.usr_firstName': searchRegex },
            { 'fol_owner.emp_user.usr_lastName': searchRegex },
            { 'fol_owner.emp_user.usr_email': searchRegex },
          ],
        },
      });
    }

    // Stage 6: Filter by owner if provided
    if (owner && isValidObjectId(owner)) {
      pipeline.push({
        $match: { 'fol_owner._id': new mongoose.Types.ObjectId(owner) },
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

    // Stage 8: Lookup document count for each folder
    pipeline.push({
      $lookup: {
        from: 'documents',
        localField: '_id',
        foreignField: 'doc_parent',
        as: 'documents',
      },
    });

    // Stage 9: Add document count field
    pipeline.push({
      $addFields: {
        documentCount: { $size: '$documents' },
      },
    });

    // Stage 10: Project to include only necessary fields
    pipeline.push({
      $project: {
        _id: 1,
        fol_name: 1,
        documentCount: 1,
        createdAt: 1,
        updatedAt: 1,
        fol_owner: {
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
      },
    });

    // Stage 11: Sort the results
    const sortField = sortBy || 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    pipeline.push({
      $sort: { [sortField]: sortDirection },
    });

    // Get total count first (for pagination)
    const countPipeline = [...pipeline]; // Clone the pipeline
    countPipeline.push({ $count: 'total' });
    const countResult = await DocumentFolderModel.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Stage 12: Apply pagination
    pipeline.push({ $skip: (page - 1) * limit });
    pipeline.push({ $limit: +limit });

    // Execute the aggregation
    const folders = await DocumentFolderModel.aggregate(pipeline);
    const totalPages = Math.ceil(total / limit);

    return {
      data: getReturnList(folders),
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
 * Get folder by ID with populated data
 * @param {string} folderId - Folder ID
 */
const getFolderById = async function (folderId: string) {
  try {
    if (!isValidObjectId(folderId)) {
      throw new BadRequestError('Id thư mục không hợp lệ');
    }

    const folder = await DocumentFolderModel.findById(folderId).populate({
      path: 'fol_owner',
      select: 'emp_code emp_position emp_user',
      populate: {
        path: 'emp_user',
        select:
          'usr_firstName usr_lastName usr_email usr_username usr_msisdn usr_avatar usr_status usr_role',
      },
    });
    if (!folder) {
      throw new NotFoundError('Không tìm thấy thư mục');
    }

    return getReturnData(folder);
  } catch (error) {
    throw error;
  }
};

/**
 * Update folder
 * @param {string} folderId - Folder ID
 * @param {IDocumentFolderCreate} payload - Updated folder data
 */
const updateFolder = async function (
  folderId: string,
  payload: Partial<IDocumentFolderCreate>
) {
  try {
    if (!isValidObjectId(folderId)) {
      throw new BadRequestError('Id thư mục không hợp lệ');
    }

    // Check if folder exists and user has permission
    const folder = await DocumentFolderModel.findById(folderId);
    if (!folder) {
      throw new NotFoundError('Không tìm thấy thư mục');
    }

    const updatedFolder = await DocumentFolderModel.findByIdAndUpdate(
      folderId,
      formatAttributeName(payload, DOCUMENT_FOLDER.PREFIX),
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedFolder) {
      throw new NotFoundError('Không tìm thấy thư mục');
    }

    return getReturnData(updatedFolder);
  } catch (error) {
    throw error;
  }
};

/**
 * Delete folder
 * @param {string} folderId - Folder ID
 */
const deleteFolder = async function (folderId: string) {
  try {
    if (!isValidObjectId(folderId)) {
      throw new BadRequestError('Id thư mục không hợp lệ');
    }

    // Check if folder exists and user has permission
    const folder = await DocumentFolderModel.findById(folderId);
    if (!folder) {
      throw new NotFoundError('Không tìm thấy thư mục');
    }

    // Check if folder has documents
    const docs = await DocumentModel.find({ doc_parent: folderId });
    if (docs.length > 0) {
      throw new BadRequestError(
        'Không thể xóa thư mục vì có tài liệu thuộc thư mục này. Vui lòng xóa các tài liệu trước.'
      );
    }

    await DocumentFolderModel.findByIdAndDelete(folderId);
    return getReturnData({
      success: true,
      message: 'Folder deleted successfully',
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Bulk delete folders
 * @param {string[]} folderIds - Array of folder IDs
 */
const bulkDeleteFolders = async function (folderIds: string[]) {
  try {
    if (!Array.isArray(folderIds) || folderIds.length === 0) {
      throw new BadRequestError('Id thư mục không hợp lệ');
    }

    const validIds = folderIds.filter((id) => isValidObjectId(id));
    if (validIds.length === 0) {
      throw new BadRequestError('Id thư mục không hợp lệ');
    }

    // Check if any folder has documents
    const docs = await DocumentModel.find({ doc_parent: { $in: validIds } });
    if (docs.length > 0) {
      throw new BadRequestError(
        'Không thể xóa thư mục vì có tài liệu thuộc thư mục này. Vui lòng xóa các tài liệu trước.'
      );
    }

    const res = await DocumentFolderModel.deleteMany({
      _id: { $in: validIds },
    });
    return getReturnData({
      success: true,
      message: 'Folders deleted successfully',
      deletedCount: res.deletedCount,
    });
  } catch (error) {
    throw error;
  }
};

export {
  createFolder,
  getFolders,
  getFolderById,
  updateFolder,
  deleteFolder,
  bulkDeleteFolders,
};
