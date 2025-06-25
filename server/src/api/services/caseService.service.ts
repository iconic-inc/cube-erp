import mongoose, { Types } from 'mongoose';
import {
  ICaseServiceCreate,
  ICaseServiceQuery,
  ICaseServiceUpdate,
  ICaseServiceResponse,
} from '../interfaces/caseService.interface';
import { BadRequestError, NotFoundError } from '../core/errors';
import { DocumentModel } from '@models/document.model';
import { DocumentCaseModel } from '@models/documentCase.model';
import { IDocumentQuery } from '../interfaces/document.interface';
import {
  getReturnList,
  getReturnData,
  formatAttributeName,
  removeNestedNullish,
} from '@utils/index';
import { getEmployeeByUserId } from './employee.service';
import { CaseServiceModel } from '@models/caseService.model';
import { CASE_SERVICE, TASK } from '../constants';
import { TaskTemplateModel } from '@models/taskTemplate.model';
import { TaskModel } from '@models/task.model';
import '@utils/date.util'; // Ensure date utilities are loaded
import { getTasks } from './task.service';

const getCaseServices = async (
  query: ICaseServiceQuery = {}
): Promise<{
  data: ICaseServiceResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> => {
  try {
    // Apply pagination options
    const {
      page = 1,
      limit = 10,
      search,
      sortBy,
      sortOrder,
      status,
      startDate,
      endDate,
      customerId,
      leadAttorneyId,
    } = query;

    // Build the aggregation pipeline
    const pipeline: any[] = [];

    // Stage 1: Match by filters
    const matchConditions: any = {};

    // Add search filter if provided
    if (search) {
      const searchRegex = new RegExp(search, 'i'); // Case-insensitive search
      matchConditions.$or = [
        { case_code: searchRegex },
        { case_notes: searchRegex },
      ];
    }

    // Add status filter if provided
    if (status) {
      matchConditions.case_status = status;
    }

    // Add date range filters if provided
    if (startDate || endDate) {
      matchConditions.case_startDate = {};

      if (startDate) {
        matchConditions.case_startDate.$gte = new Date(startDate);
      }

      if (endDate) {
        if (!matchConditions.case_startDate) {
          matchConditions.case_startDate = {};
        }
        matchConditions.case_startDate.$lte = new Date(endDate);
      }
    }

    // Add customer filter if provided
    if (customerId) {
      matchConditions.case_customer = new Types.ObjectId(customerId);
    }

    // Add lead attorney filter if provided
    if (leadAttorneyId) {
      matchConditions.case_leadAttorney = new Types.ObjectId(leadAttorneyId);
    }

    // Add match stage if we have any conditions
    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }

    // Stage 2: Lookup customer information
    pipeline.push({
      $lookup: {
        from: 'customers',
        localField: 'case_customer',
        foreignField: '_id',
        as: 'case_customer',
      },
    });

    // Stage 3: Lookup lead attorney information
    pipeline.push({
      $lookup: {
        from: 'employees',
        localField: 'case_leadAttorney',
        foreignField: '_id',
        as: 'case_leadAttorney',
        pipeline: [
          {
            $lookup: {
              from: 'users',
              localField: 'emp_user',
              foreignField: '_id',
              as: 'emp_user',
            },
          },
          {
            $unwind: { path: '$emp_user', preserveNullAndEmptyArrays: true },
          },
        ],
      },
    });

    // Stage 4: Lookup assignees information if available
    pipeline.push({
      $lookup: {
        from: 'employees',
        localField: 'case_assignees',
        foreignField: '_id',
        as: 'case_assignees',
        pipeline: [
          {
            $lookup: {
              from: 'users',
              localField: 'emp_user',
              foreignField: '_id',
              as: 'emp_user',
            },
          },
          {
            $unwind: { path: '$emp_user', preserveNullAndEmptyArrays: true },
          },
        ],
      },
    });

    // Stage 5: Unwind the arrays to work with single documents
    pipeline.push({
      $unwind: { path: '$case_customer', preserveNullAndEmptyArrays: true },
    });
    pipeline.push({
      $unwind: { path: '$case_leadAttorney', preserveNullAndEmptyArrays: true },
    });

    // Stage 6: Project to include only necessary fields and transform to match ICaseServiceResponse
    pipeline.push({
      $project: {
        _id: 1,
        case_customer: {
          _id: 1,
          cus_firstName: '$case_customer.cus_firstName',
          cus_lastName: '$case_customer.cus_lastName',
          cus_code: '$case_customer.cus_code',
        },
        case_code: 1,
        case_leadAttorney: {
          _id: 1,
          emp_user: {
            _id: 1,
            usr_username: '$case_leadAttorney.emp_user.usr_username',
            usr_email: '$case_leadAttorney.emp_user.usr_email',
            usr_firstName: '$case_leadAttorney.emp_user.usr_firstName',
            usr_lastName: '$case_leadAttorney.emp_user.usr_lastName',
          },
          emp_code: '$case_leadAttorney.emp_code',
          emp_position: '$case_leadAttorney.emp_position',
          emp_department: '$case_leadAttorney.emp_department',
        },
        case_assignees: {
          $map: {
            input: '$case_assignees',
            as: 'assignee',
            in: {
              _id: 1,
              emp_user: {
                _id: 1,
                usr_username: '$$assignee.emp_user.usr_username',
                usr_email: '$$assignee.emp_user.usr_email',
                usr_firstName: '$$assignee.emp_user.usr_firstName',
                usr_lastName: '$$assignee.emp_user.usr_lastName',
              },
              emp_code: '$$assignee.emp_code',
              emp_position: '$$assignee.emp_position',
              emp_department: '$$assignee.emp_department',
            },
          },
        },
        case_notes: 1,
        case_status: 1,
        case_startDate: 1,
        case_endDate: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    });

    // Stage 7: Sort the results
    const sortField = sortBy ? `${sortBy}` : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    pipeline.push({
      $sort: { [sortField]: sortDirection },
    });

    // Get total count first (for pagination)
    const countPipeline = [...pipeline]; // Clone the pipeline
    countPipeline.push({ $count: 'total' });
    const countResult = await CaseServiceModel.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Stage 8: Apply pagination
    pipeline.push({ $skip: (page - 1) * limit });
    pipeline.push({ $limit: +limit });

    // Execute the aggregation
    const caseServices = await CaseServiceModel.aggregate(pipeline);
    const totalPages = Math.ceil(total / limit);

    return {
      data: getReturnList(caseServices) as ICaseServiceResponse[],
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  } catch (error) {
    // Wrap original error with Vietnamese message if it's a standard Error
    if (
      error instanceof Error &&
      !(error instanceof BadRequestError) &&
      !(error instanceof NotFoundError)
    ) {
      throw new Error(
        `Đã xảy ra lỗi khi lấy danh sách Hồ sơ vụ việc: ${error.message}`
      );
    }
    throw error;
  }
};

const getCaseServiceById = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new BadRequestError('ID Hồ sơ vụ việc không hợp lệ');
  }

  const caseService = await CaseServiceModel.findById(id)
    .populate([
      {
        path: 'case_customer',
        select: 'cus_firstName cus_lastName cus_email cus_msisdn cus_code',
      },
      {
        path: 'case_leadAttorney',
        select: 'emp_user emp_code emp_position emp_department',
        populate: {
          path: 'emp_user',
          select: 'usr_username usr_email usr_firstName usr_lastName',
        },
      },
      {
        path: 'case_assignees',
        select: 'emp_user emp_code emp_position emp_department',
        populate: {
          path: 'emp_user',
          select: 'usr_username usr_email usr_firstName usr_lastName',
        },
      },
    ])
    .lean();
  if (!caseService) {
    throw new NotFoundError('Không tìm thấy Hồ sơ vụ việc');
  }

  return getReturnData(caseService);
};

const createCaseService = async (caseServiceData: ICaseServiceCreate) => {
  const [foundCase, taskTemplate] = await Promise.all([
    CaseServiceModel.findOne({
      case_code: caseServiceData.code,
    }),
    TaskTemplateModel.findOne({ tpl_key: 'default' }).lean(),
  ]);
  if (foundCase) {
    throw new BadRequestError('Mã Hồ sơ vụ việc đã tồn tại');
  }
  if (!taskTemplate) {
    throw new NotFoundError('Không tìm thấy mẫu công việc mặc định');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [caseService] = await CaseServiceModel.create(
      [formatAttributeName(caseServiceData, CASE_SERVICE.PREFIX)],
      { session }
    );
    if (!caseService) {
      throw new BadRequestError('Không thể tạo Hồ sơ vụ việc');
    }

    for (const step of taskTemplate.tpl_steps) {
      const [task] = await TaskModel.create(
        [
          formatAttributeName(
            {
              ...step,
              _id: undefined, // Remove _id to avoid conflicts
              caseService: caseService._id,
              startDate: new Date().addDays(step.caseOrder - 1), // Default start date is relative to case order (0-6)
              endDate: new Date().addDays(step.caseOrder), // Default end date is one day after start date (1-7)
              assignees: [
                ...(caseServiceData.assignees || []),
                caseServiceData.leadAttorney,
              ],
            },
            TASK.PREFIX
          ),
        ],
        { session }
      );
      if (!task) {
        throw new BadRequestError('Không thể tạo công việc');
      }
    }
    await session.commitTransaction();

    return getReturnData(caseService);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const updateCaseService = async (id: string, data: ICaseServiceUpdate) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new BadRequestError('ID Hồ sơ vụ việc không hợp lệ');
  }

  // Check if case service exists
  const existingCaseService = await CaseServiceModel.findById(id);
  if (!existingCaseService) {
    throw new NotFoundError('Không tìm thấy Hồ sơ vụ việc');
  }

  // Check if the new code already exists (if code is being updated)
  if (data.code && data.code !== existingCaseService.case_code) {
    const duplicateCase = await CaseServiceModel.findOne({
      case_code: data.code,
      _id: { $ne: id },
    });
    if (duplicateCase) {
      throw new BadRequestError('Mã Hồ sơ vụ việc đã tồn tại');
    }
  }

  try {
    const updatedCaseService = await CaseServiceModel.findByIdAndUpdate(
      id,
      {
        $set: formatAttributeName(
          removeNestedNullish({
            ...data,
            customer: data.customer,
            leadAttorney: data.leadAttorney,
            assignees: data.assignees,
            code: data.code,
            notes: data.notes,
            status: data.status,
            startDate: data.startDate ? new Date(data.startDate) : undefined,
            endDate: data.endDate ? new Date(data.endDate) : undefined,
          }),
          CASE_SERVICE.PREFIX
        ),
      },
      { new: true }
    )
      .populate([
        {
          path: 'case_customer',
          select: 'cus_firstName cus_lastName cus_email cus_msisdn cus_code',
        },
        {
          path: 'case_leadAttorney',
          select: 'emp_user emp_code emp_position emp_department',
          populate: {
            path: 'emp_user',
            select: 'usr_username usr_email usr_firstName usr_lastName',
          },
        },
        {
          path: 'case_assignees',
          select: 'emp_user emp_code emp_position emp_department',
          populate: {
            path: 'emp_user',
            select: 'usr_username usr_email usr_firstName usr_lastName',
          },
        },
      ])
      .lean();

    if (!updatedCaseService) {
      throw new NotFoundError('Không tìm thấy Hồ sơ vụ việc sau khi cập nhật');
    }

    return getReturnData(updatedCaseService);
  } catch (error) {
    // Wrap original error with Vietnamese message if it's a standard Error
    if (
      error instanceof Error &&
      !(error instanceof BadRequestError) &&
      !(error instanceof NotFoundError)
    ) {
      throw new Error(
        `Đã xảy ra lỗi khi cập nhật Hồ sơ vụ việc: ${error.message}`
      );
    }
    throw error;
  }
};

const deleteCaseService = async (id: string) => {};

const bulkDeleteCaseServices = async (ids: string[]) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await CaseServiceModel.deleteMany({ _id: { $in: ids } }, { session });
    await DocumentCaseModel.deleteMany(
      { caseService: { $in: ids } },
      { session }
    );
    await TaskModel.deleteMany({ tsk_caseService: { $in: ids } }, { session });
    await DocumentCaseModel.deleteMany(
      { caseService: { $in: ids } },
      { session }
    );
    await session.commitTransaction();
    return { success: true, message: 'Bulk delete successful' };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const importCaseServices = async (filePath: string) => {};

const exportCaseServicesToXLSX = async (query: any) => {};

/**
 * Attach document to a case
 * @param {string[]} documentIds - Document ID
 * @param {string} caseId - Case service ID
 * @param {string} userId - user ID of the employee making the request
 */
const attachDocumentToCase = async (
  documentIds: string[],
  caseId: string,
  userId: string
) => {
  // Input already validated before going to controller using zod

  try {
    const [docRes, caseRes, employeeRes] = await Promise.allSettled([
      DocumentModel.find({
        _id: { $in: documentIds },
      }),
      CaseServiceModel.findById(caseId),
      getEmployeeByUserId(userId),
    ]);

    if (
      docRes.status === 'rejected' ||
      caseRes.status === 'rejected' ||
      employeeRes.status === 'rejected'
    ) {
      throw new BadRequestError(
        'Không tìm thấy tài liệu, Hồ sơ vụ việc hoặc nhân viên'
      );
    }

    const documents = docRes.value;
    const caseService = caseRes.value;
    const employee = employeeRes.value;

    if (!caseService) {
      throw new NotFoundError('Không tìm thấy Hồ sơ vụ việc');
    }

    // Check which documents exist
    const foundDocumentIds = documents.map((doc) => doc._id.toString());
    const notFoundDocumentIds = documentIds.filter(
      (id) => !foundDocumentIds.includes(id)
    );
    if (notFoundDocumentIds.length > 0) {
      throw new NotFoundError(`Không tìm thấy tài liệu.`);
    }

    // Check which documents are already attached to this case
    const existingRelations = await DocumentCaseModel.find({
      document: { $in: documentIds },
      caseService: caseId,
    });

    const alreadyAttachedDocumentIds = existingRelations.map((rel) =>
      rel.document.toString()
    );
    const documentsToAttach = documentIds.filter(
      (id) =>
        !alreadyAttachedDocumentIds.includes(id) &&
        foundDocumentIds.includes(id)
    );

    // Prepare result summary
    const result = {
      success: true,
      message: '',
      details: {
        total: documentIds.length,
        alreadyAttached: alreadyAttachedDocumentIds.length,
        newlyAttached: documentsToAttach.length,
        notFound: notFoundDocumentIds.length,
        alreadyAttachedIds: alreadyAttachedDocumentIds,
        newlyAttachedIds: documentsToAttach,
        notFoundIds: notFoundDocumentIds,
      },
    };

    // Create new document-case relationships for documents that aren't already attached
    if (documentsToAttach.length > 0) {
      const relations = documentsToAttach.map((docId) => ({
        document: docId,
        caseService: caseId,
        createdBy: employee.id,
      }));

      await DocumentCaseModel.insertMany(relations);
    }

    // Generate appropriate message based on results
    const messages = [];
    if (result.details.newlyAttached > 0) {
      messages.push(
        `${result.details.newlyAttached} tài liệu đã được đính kèm mới`
      );
    }
    if (result.details.alreadyAttached > 0) {
      messages.push(
        `${result.details.alreadyAttached} tài liệu đã được đính kèm trước đó`
      );
    }
    if (result.details.notFound > 0) {
      messages.push(`${result.details.notFound} tài liệu không tìm thấy`);
    }

    if (messages.length === 0) {
      result.message = 'Không có tài liệu nào được xử lý';
    } else {
      result.message = messages.join(', ');
    }

    // Add success indicator based on whether any new attachments were made
    if (
      result.details.newlyAttached === 0 &&
      result.details.alreadyAttached === 0 &&
      result.details.notFound > 0
    ) {
      result.success = false;
      result.message = 'Không tìm thấy tài liệu nào để đính kèm';
    }

    return result;
  } catch (error) {
    // Wrap original error with Vietnamese message if it's a standard Error
    if (
      error instanceof Error &&
      !(error instanceof BadRequestError) &&
      !(error instanceof NotFoundError)
    ) {
      throw new Error(
        `Đã xảy ra lỗi khi đính kèm tài liệu vào Hồ sơ vụ việc: ${error.message}`
      );
    }
    throw error;
  }
};

/**
 * Detach document from a case
 * @param {string} documentId - Document ID
 * @param {string} caseId - Case service ID
 * @param {string} employeeId - ID of the employee making the request
 */
const detachDocumentFromCase = async (
  caseDocumentIds: string[],
  caseId: string
) => {
  const caseDocuments = await DocumentCaseModel.find({
    _id: { $in: caseDocumentIds },
  });

  if (!caseDocuments.length) {
    return {
      message:
        'Không tìm thấy tài liệu nào được đính kèm vào Hồ sơ vụ việc này',
      success: true,
    };
  }

  await DocumentCaseModel.deleteMany({
    _id: { $in: caseDocumentIds },
    caseService: caseId,
  });

  return {
    message: 'Tài liệu đã được gỡ khỏi Hồ sơ vụ việc thành công',
    success: true,
  };
};

/**
 * Get documents by case
 * @param {string} caseId - Case service ID
 * @param {string} userId - ID of the employee making the request
 * @param {IDocumentQuery} query - Query parameters for filtering documents
 */
const getCaseServiceDocuments = async (
  caseId: string,
  userId: string,
  query: IDocumentQuery = {}
) => {
  if (!Types.ObjectId.isValid(caseId)) {
    throw new BadRequestError('Invalid case ID');
  }

  try {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy,
      sortOrder = 'desc',
      type,
      startDate,
      endDate,
    } = query;

    const employee = await getEmployeeByUserId(userId);
    const employeeId = employee.id;

    // Build the aggregation pipeline starting from DocumentCase
    const pipeline: any[] = [];

    // Stage 1: Match documents attached to this case service
    pipeline.push({
      $match: {
        caseService: new Types.ObjectId(caseId),
      },
    });

    // Stage 2: Lookup to get document details
    pipeline.push({
      $lookup: {
        from: 'documents',
        localField: 'document',
        foreignField: '_id',
        as: 'document',
      },
    });

    // Stage 3: Unwind document array
    pipeline.push({
      $unwind: {
        path: '$document',
        preserveNullAndEmptyArrays: false,
      },
    });

    // Stage 4: Check document access permissions
    pipeline.push({
      $match: {
        $or: [
          { 'document.doc_isPublic': true },
          { 'document.doc_createdBy': new Types.ObjectId(employeeId) },
          {
            'document.doc_whiteList': { $in: [new Types.ObjectId(employeeId)] },
          },
        ],
      },
    });

    // Stage 5: Lookup to populate document creator information
    pipeline.push({
      $lookup: {
        from: 'employees',
        localField: 'document.doc_createdBy',
        foreignField: '_id',
        as: 'document.doc_createdBy',
      },
    });

    // Stage 6: Unwind createdBy array
    pipeline.push({
      $unwind: {
        path: '$document.doc_createdBy',
        preserveNullAndEmptyArrays: true,
      },
    });

    // Stage 7: Lookup to populate user information for creator
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'document.doc_createdBy.emp_user',
        foreignField: '_id',
        as: 'document.doc_createdBy.emp_user',
      },
    });

    // Stage 8: Unwind the user array for creator
    pipeline.push({
      $unwind: {
        path: '$document.doc_createdBy.emp_user',
        preserveNullAndEmptyArrays: true,
      },
    });

    // Stage 9: Lookup to populate whitelist information
    pipeline.push({
      $lookup: {
        from: 'employees',
        localField: 'document.doc_whiteList',
        foreignField: '_id',
        as: 'document.doc_whiteList',
      },
    });

    // Stage 10: Lookup to populate user information for whitelist employees
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'document.doc_whiteList.emp_user',
        foreignField: '_id',
        as: 'whitelistUsers',
      },
    });

    // Stage 11: Add user information to each employee in whitelist
    pipeline.push({
      $addFields: {
        'document.doc_whiteList': {
          $map: {
            input: '$document.doc_whiteList',
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

    // Stage 12: Lookup to populate the employee who attached the document
    pipeline.push({
      $lookup: {
        from: 'employees',
        localField: 'createdBy',
        foreignField: '_id',
        as: 'createdBy',
      },
    });

    // Stage 13: Unwind createdBy array
    pipeline.push({
      $unwind: {
        path: '$createdBy',
        preserveNullAndEmptyArrays: true,
      },
    });

    // Stage 14: Lookup to populate user information for the one who attached
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'createdBy.emp_user',
        foreignField: '_id',
        as: 'createdBy.emp_user',
      },
    });

    // Stage 15: Unwind the user array for the one who attached
    pipeline.push({
      $unwind: {
        path: '$createdBy.emp_user',
        preserveNullAndEmptyArrays: true,
      },
    });

    // Stage 16: Apply search filter if provided
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      pipeline.push({
        $match: {
          $or: [
            { 'document.doc_name': searchRegex },
            { 'document.doc_description': searchRegex },
            { 'document.doc_type': searchRegex },
            { 'document.doc_createdBy.emp_code': searchRegex },
            { 'createdBy.emp_code': searchRegex },
          ],
        },
      });
    }

    // Stage 17: Filter by document type if provided
    if (type) {
      pipeline.push({
        $match: { 'document.doc_type': type },
      });
    }

    // Stage 18: Filter by date range if provided
    if (startDate || endDate) {
      const dateFilter: any = {};

      if (startDate) {
        dateFilter.$gte = new Date(startDate);
      }

      if (endDate) {
        dateFilter.$lte = new Date(endDate);
      }

      pipeline.push({
        $match: { 'document.createdAt': dateFilter },
      });
    }

    // Stage 19: Project to include only necessary fields
    pipeline.push({
      $project: {
        _id: 1,
        caseService: 1,
        createdAt: 1,
        updatedAt: 1,
        createdBy: {
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
        document: {
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
      },
    });

    // Stage 20: Sort the results
    const sortField = sortBy ? `document.${sortBy}` : 'document.createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    pipeline.push({
      $sort: { [sortField]: sortDirection },
    });

    // Get total count first (for pagination)
    const countPipeline = [...pipeline]; // Clone the pipeline
    countPipeline.push({ $count: 'total' });
    const countResult = await DocumentCaseModel.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Stage 21: Apply pagination
    pipeline.push({ $skip: (page - 1) * limit });
    pipeline.push({ $limit: +limit });

    // Execute the aggregation
    const documentCases = await DocumentCaseModel.aggregate(pipeline);
    const totalPages = Math.ceil(total / limit);

    return {
      data: getReturnList(documentCases),
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  } catch (error) {
    // Wrap original error with Vietnamese message if it's a standard Error
    if (
      error instanceof Error &&
      !(error instanceof BadRequestError) &&
      !(error instanceof NotFoundError)
    ) {
      throw new Error(
        `Đã xảy ra lỗi khi lấy danh sách tài liệu của Hồ sơ vụ việc: ${error.message}`
      );
    }
    throw error;
  }
};

/**
 * Get tasks associated with a case service
 * @param {string} caseId - Case service ID
 */
const getCaseServiceTasks = async (caseId: string) => {
  if (!Types.ObjectId.isValid(caseId)) {
    throw new BadRequestError('Invalid case ID');
  }

  // Find all tasks associated with this case
  return await getTasks({
    caseService: caseId,
    limit: 1000,
    sortBy: 'tsk_caseOrder',
    sortOrder: 'asc',
  });
};

export {
  getCaseServices,
  getCaseServiceById,
  getCaseServiceTasks,
  createCaseService,
  updateCaseService,
  deleteCaseService,
  bulkDeleteCaseServices,
  importCaseServices,
  exportCaseServicesToXLSX,
  attachDocumentToCase,
  detachDocumentFromCase,
  getCaseServiceDocuments,
};
