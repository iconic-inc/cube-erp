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
import { CUSTOMER } from '../constants/customer.constant';
import { USER } from '../constants/user.constant';
import { TaskTemplateModel } from '@models/taskTemplate.model';
import { TaskModel } from '@models/task.model';
import '@utils/date.util'; // Ensure date utilities are loaded
import { getTasks } from './task.service';
import { sendTaskNotificationEmail } from './email.service';

// Import modules for export functionality
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { serverConfig } from '@configs/config.server';

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

    // Stage 1: Match by filters (early filtering)
    const matchConditions: any = {};

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
        from: CUSTOMER.COLLECTION_NAME,
        localField: 'case_customer',
        foreignField: '_id',
        as: 'case_customer',
      },
    });

    // Stage 3: Lookup lead attorney information with nested user lookup
    pipeline.push({
      $lookup: {
        from: USER.EMPLOYEE.COLLECTION_NAME,
        localField: 'case_leadAttorney',
        foreignField: '_id',
        as: 'case_leadAttorney',
        pipeline: [
          {
            $lookup: {
              from: USER.COLLECTION_NAME,
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

    // Stage 4: Lookup assignees information with nested user lookup
    pipeline.push({
      $lookup: {
        from: USER.EMPLOYEE.COLLECTION_NAME,
        localField: 'case_assignees',
        foreignField: '_id',
        as: 'case_assignees',
        pipeline: [
          {
            $lookup: {
              from: USER.COLLECTION_NAME,
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

    // Stage 6: Add search filter if provided (after lookups for richer search)
    if (search) {
      const searchRegex = new RegExp(search, 'i'); // Case-insensitive search
      pipeline.push({
        $match: {
          $or: [
            { case_code: searchRegex },
            { case_notes: searchRegex },
            { 'case_customer.cus_firstName': searchRegex },
            { 'case_customer.cus_lastName': searchRegex },
            { 'case_customer.cus_code': searchRegex },
            { 'case_leadAttorney.emp_user.usr_firstName': searchRegex },
            { 'case_leadAttorney.emp_user.usr_lastName': searchRegex },
            { 'case_leadAttorney.emp_user.usr_username': searchRegex },
            { 'case_leadAttorney.emp_code': searchRegex },
            { 'case_assignees.emp_user.usr_firstName': searchRegex },
            { 'case_assignees.emp_user.usr_lastName': searchRegex },
            { 'case_assignees.emp_user.usr_username': searchRegex },
            { 'case_assignees.emp_code': searchRegex },
          ],
        },
      });
    }

    // Stage 8: Project to include only necessary fields and transform to match ICaseServiceResponse
    pipeline.push({
      $project: {
        _id: 1,
        case_customer: {
          _id: 1,
          cus_firstName: 1,
          cus_lastName: 1,
          cus_code: 1,
        },
        case_code: 1,
        case_leadAttorney: {
          _id: 1,
          emp_user: {
            _id: 1,
            usr_username: 1,
            usr_email: 1,
            usr_firstName: 1,
            usr_lastName: 1,
          },
          emp_code: 1,
          emp_position: 1,
          emp_department: 1,
        },
        case_assignees: {
          $map: {
            input: '$case_assignees',
            as: 'assignee',
            in: {
              _id: '$$assignee._id',
              emp_user: {
                _id: '$$assignee.emp_user._id',
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

    // Stage 9: Sort the results
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

    // Stage 10: Apply pagination
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
              name: `${caseServiceData.code} - ${step.name}`,
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

      // Get the created task with populated data for email notification
      const populatedTask = await TaskModel.findById(task._id)
        .populate({
          path: 'tsk_assignees',
          select: 'emp_code emp_position emp_department emp_user',
          populate: {
            path: 'emp_user',
            select:
              'usr_firstName usr_lastName usr_email usr_avatar usr_username',
          },
        })
        .populate({
          path: 'tsk_caseService',
          select:
            'case_code case_customer case_leadAttorney case_status case_startDate case_endDate',
          populate: {
            path: 'case_customer',
            select: 'cus_firstName cus_lastName cus_email cus_msisdn cus_code',
          },
        })
        .session(session);

      // Send email notifications to assignees
      if (populatedTask && populatedTask.tsk_assignees) {
        const emailPromises = populatedTask.tsk_assignees.map(
          async (assignee: any) => {
            if (assignee.emp_user?.usr_email) {
              try {
                await sendTaskNotificationEmail(assignee.emp_user.usr_email, {
                  taskId: populatedTask._id.toString(),
                  taskName: populatedTask.tsk_name,
                  taskDescription:
                    populatedTask.tsk_description || 'Không có mô tả',
                  priority: populatedTask.tsk_priority,
                  startDate: new Date(
                    populatedTask.tsk_startDate
                  ).toLocaleString('vi-VN'),
                  endDate: new Date(populatedTask.tsk_endDate).toLocaleString(
                    'vi-VN'
                  ),
                  employeeName: `${assignee.emp_user.usr_firstName || ''} ${
                    assignee.emp_user.usr_lastName || ''
                  }`.trim(),
                });
              } catch (emailError) {
                console.error(
                  `Failed to send email to ${assignee.emp_user.usr_email}:`,
                  emailError
                );
                // Don't throw error to prevent transaction rollback due to email failures
              }
            }
          }
        );

        // Execute email notifications (but don't wait for them to complete to avoid blocking the transaction)
        Promise.allSettled(emailPromises).catch((error) => {
          console.error('Error sending some task notification emails:', error);
        });
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
    if (
      !data.endDate &&
      ['closed', 'completed'].includes(data.status as string)
    ) {
      // If status is closed or completed, set endDate to now
      data.endDate = new Date().toISOString();
    }

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
            startDate: data.startDate
              ? new Date(data.startDate).toISOString()
              : undefined,
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

const exportCaseServicesToXLSX = async (query: ICaseServiceQuery = {}) => {
  try {
    // Reuse the same query logic from getCaseServices but get all data for export
    const { data: caseServicesList } = await getCaseServices({
      ...query,
      page: 1,
      limit: Number.MAX_SAFE_INTEGER, // Get all records for export
    });

    // Create directory if it doesn't exist
    const exportDir = path.join(process.cwd(), 'public', 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    } else {
      // Clean up old case service export files
      for (const file of fs.readdirSync(exportDir)) {
        if (file.startsWith('ho_so_vu_viec_') && file.endsWith('.xlsx')) {
          fs.unlinkSync(path.join(exportDir, file));
        }
      }
    }

    // Create timestamp for unique filename
    const timestamp = new Date().getTime();
    const fileName = `ho_so_vu_viec_${new Date()
      .toLocaleDateString('vi-VN')
      .split('/')
      .join('-')}_${timestamp}.xlsx`;
    const filePath = path.join(exportDir, fileName);

    // Map case service data for Excel
    const excelData = caseServicesList.map((caseService) => {
      return {
        'Mã hồ sơ': caseService.case_code || '',
        'Khách hàng': caseService.case_customer
          ? `${caseService.case_customer.cus_firstName} ${caseService.case_customer.cus_lastName}`
          : '',
        'Mã khách hàng': caseService.case_customer?.cus_code || '',
        'Luật sư chính': caseService.case_leadAttorney
          ? `${caseService.case_leadAttorney.emp_user.usr_firstName} ${caseService.case_leadAttorney.emp_user.usr_lastName}`
          : '',
        'Mã luật sư': caseService.case_leadAttorney?.emp_code || '',
        'Phòng ban': caseService.case_leadAttorney?.emp_department || '',
        'Chức vụ': caseService.case_leadAttorney?.emp_position || '',
        'Người được phân công': caseService.case_assignees
          ? caseService.case_assignees
              .map(
                (assignee) =>
                  `${assignee.emp_user.usr_firstName} ${assignee.emp_user.usr_lastName}`
              )
              .join(', ')
          : '',
        'Trạng thái': caseService.case_status || '',
        'Ghi chú': caseService.case_notes || '',
        'Ngày bắt đầu': caseService.case_startDate
          ? new Date(caseService.case_startDate).toLocaleDateString('vi-VN')
          : '',
        'Ngày kết thúc': caseService.case_endDate
          ? new Date(caseService.case_endDate).toLocaleDateString('vi-VN')
          : '',
        'Thời gian tạo': caseService.createdAt
          ? new Date(caseService.createdAt).toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
          : '',
        'Cập nhật lần cuối': caseService.updatedAt
          ? new Date(caseService.updatedAt).toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
          : '',
      };
    });

    // Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Hồ sơ vụ việc');

    // Write to file
    XLSX.writeFile(workbook, filePath);

    return {
      fileUrl: `${serverConfig.serverUrl}/exports/${fileName}`,
      fileName: fileName,
      count: excelData.length,
    };
  } catch (error) {
    // Wrap original error with Vietnamese message if it's a standard Error
    if (
      error instanceof Error &&
      !(error instanceof BadRequestError) &&
      !(error instanceof NotFoundError)
    ) {
      throw new Error(
        `Đã xảy ra lỗi khi xuất dữ liệu Hồ sơ vụ việc: ${error.message}`
      );
    }
    throw error;
  }
};

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
