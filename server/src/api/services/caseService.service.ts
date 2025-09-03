import mongoose, { Types } from 'mongoose';
import {
  ICaseServiceCreate,
  ICaseServiceQuery,
  ICaseServiceUpdate,
  ICaseServiceResponse,
  InstallmentPlanItem,
  IncurredCost,
  CaseParticipant,
} from '../interfaces/caseService.interface';
import { BadRequestError, ForbiddenError, NotFoundError } from '../core/errors';
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
import { TRANSACTION } from '../constants/transaction.constant';
import { TaskModel } from '@models/task.model';
import '@utils/date.util'; // Ensure date utilities are loaded
import { createTasksFromTemplate, getTasks } from './task.service';
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from './transaction.service';

// Import modules for export functionality
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { serverConfig } from '@configs/config.server';
import { parse } from 'date-fns';
import { EmployeeModel } from '@models/employee.model';
import { ITask } from '../interfaces/task.interface';

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
      employeeUserId,
    } = query;

    // Get employee ID if employeeUserId is provided
    let employeeId: string | undefined;
    if (employeeUserId) {
      try {
        const employee = await getEmployeeByUserId(employeeUserId);
        employeeId = employee.id;
      } catch (error) {
        // If employee not found, return empty result
        return {
          data: [],
          pagination: {
            total: 0,
            page,
            limit,
            totalPages: 0,
          },
        };
      }
    }

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

    // Add employee filter if provided (using participant model)
    if (employeeId) {
      // Find case services where the employee is a participant in any related task
      const participantTasks = await TaskModel.aggregate([
        {
          $lookup: {
            from: 'case_participants',
            localField: '_id',
            foreignField: 'ptt_task',
            as: 'case_participants',
          },
        },
        {
          $match: {
            case_participants: {
              $elemMatch: {
                ptt_employee: new Types.ObjectId(employeeId),
              },
            },
          },
        },
        {
          $project: {
            tsk_caseService: 1,
          },
        },
      ]);

      const caseServiceIds = participantTasks
        .map((task) => task.tsk_caseService)
        .filter((id) => id); // Remove null/undefined values

      if (caseServiceIds.length > 0) {
        matchConditions._id = { $in: caseServiceIds };
      } else {
        // If no tasks found for this employee, return empty result
        return {
          data: [],
          pagination: {
            total: 0,
            page,
            limit,
            totalPages: 0,
          },
        };
      }
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

    // Stage 5: Unwind the arrays to work with single documents
    pipeline.push({
      $unwind: { path: '$case_customer', preserveNullAndEmptyArrays: true },
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

const getCaseServiceById = async (id: string, employeeUserId: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new BadRequestError('ID Hồ sơ vụ việc không hợp lệ');
  }

  const caseService = await CaseServiceModel.findById(id)
    .populate([
      {
        path: 'case_customer',
        select: 'cus_firstName cus_lastName cus_email cus_msisdn cus_code',
      },
    ])
    .populate({
      path: 'case_participants.employeeId',
      select: 'emp_code emp_user',
      populate: {
        path: 'emp_user',
        select: 'usr_firstName usr_lastName usr_email',
      },
    })
    .lean();
  if (!caseService) {
    throw new NotFoundError('Không tìm thấy Hồ sơ vụ việc');
  }

  const employee = await getEmployeeByUserId(employeeUserId);
  const isAdmin = employee.emp_user.usr_role?.slug === 'admin';
  const isParticipant = caseService.case_participants.some(
    (participant) =>
      participant.employeeId.toString() === employee.id.toString()
  );
  if (!isAdmin && !isParticipant) {
    throw new ForbiddenError(
      'Bạn không có quyền truy cập vào Hồ sơ vụ việc này'
    );
  }
  if (!caseService) {
    throw new NotFoundError('Không tìm thấy Hồ sơ vụ việc');
  }

  return getReturnData(caseService);
};

// Helper function to calculate totals cache
const calculateTotalsCache = (caseServiceData: {
  pricing?: ICaseServiceCreate['pricing'];
  installments?: ICaseServiceCreate['installments'];
  incurredCosts?: ICaseServiceCreate['incurredCosts'];
  participants?: ICaseServiceCreate['participants'];
}) => {
  const {
    pricing,
    installments = [],
    incurredCosts = [],
    participants = [],
  } = caseServiceData;

  // Calculate scheduled amount (sum of installments)
  const scheduled = installments.reduce(
    (sum: number, installment: any) => sum + (+installment.amount || 0),
    0
  );

  // Calculate paid amount (sum of paid amounts in installments)
  const paid = installments.reduce(
    (sum: number, installment: any) => sum + (+installment.paidAmount || 0),
    0
  );

  // Calculate outstanding (scheduled - paid)
  const outstanding = scheduled - paid;

  // Calculate tax computed based on pricing
  let taxComputed = 0;
  if (pricing && pricing.taxes) {
    const baseForTax =
      (+pricing.baseAmount || 0) +
      (+pricing.addOns! || 0) +
      (+pricing.discounts! || 0);

    taxComputed = pricing.taxes.reduce((sum: number, tax: any) => {
      if (tax.mode === 'PERCENT') {
        return sum + (baseForTax * (tax.value || 0)) / 100;
      } else {
        return sum + (tax.value || 0);
      }
    }, 0);
  }

  // Calculate incurred cost total
  const incurredCostTotal = incurredCosts.reduce(
    (sum: number, cost: any) => sum + (cost.amount || 0),
    0
  );

  // Calculate commission total based on participant commissions
  const baseAmount = pricing?.baseAmount || 0;
  const addOns = pricing?.addOns || 0;
  const discounts = pricing?.discounts || 0;

  // Calculate gross amount (before taxes and costs)
  const grossAmount = baseAmount + addOns + discounts;

  // Calculate net amount (after taxes and incurred costs but before commissions)
  const netAmount = grossAmount - taxComputed - incurredCostTotal;

  let commissionTotal = 0;
  const commissionBreakdown: Array<{
    employeeId: string;
    role?: string;
    commission: {
      type: string;
      value: number;
    };
    calculatedAmount: number;
    baseAmount: number; // The amount the commission was calculated on
  }> = [];

  if (participants && participants.length > 0) {
    participants.forEach((participant: any) => {
      if (!participant.commission) return;

      const { type, value } = participant.commission;
      let commissionAmount = 0;
      let calculationBase = 0;

      switch (type) {
        case 'PERCENT_OF_GROSS':
          calculationBase = grossAmount;
          commissionAmount = (grossAmount * value) / 100;
          break;
        case 'PERCENT_OF_NET':
          calculationBase = netAmount;
          commissionAmount = (netAmount * value) / 100;
          break;
        case 'FLAT':
          calculationBase = value;
          commissionAmount = value;
          break;
        default:
          calculationBase = 0;
          commissionAmount = 0;
      }

      commissionBreakdown.push({
        employeeId:
          participant.employeeId?.toString() || participant.employeeId,
        role: participant.role,
        commission: { type, value },
        calculatedAmount: commissionAmount,
        baseAmount: calculationBase,
      });

      commissionTotal += commissionAmount;
    });
  }
  const netFinal =
    baseAmount +
    addOns +
    discounts -
    taxComputed -
    incurredCostTotal -
    commissionTotal;

  // Find next due date
  const now = new Date();
  const upcomingInstallments = installments
    .filter(
      (installment: any) =>
        installment.status !== 'PAID' && new Date(installment.dueDate) >= now
    )
    .sort(
      (a: any, b: any) =>
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  const nextDueDate =
    upcomingInstallments.length > 0
      ? new Date(upcomingInstallments[0].dueDate)
      : null;

  // Count overdue installments
  const overdueCount = installments.filter(
    (installment: any) =>
      installment.status !== 'PAID' && new Date(installment.dueDate) < now
  ).length;

  return {
    // Payment tracking
    scheduled,
    paid,
    outstanding,

    // Cost breakdown
    grossAmount, // Base + addons + discounts
    taxComputed,
    incurredCostTotal,
    commissionTotal,
    netFinal, // Final amount after all deductions

    // Commission details
    commissionBreakdown,

    // Schedule information
    nextDueDate,
    overdueCount,
  };
};

const createCaseService = async (caseServiceData: ICaseServiceCreate) => {
  const foundCase = await CaseServiceModel.findOne({
    case_code: caseServiceData.code,
  });
  if (foundCase) {
    throw new BadRequestError('Mã Hồ sơ vụ việc đã tồn tại');
  }

  // Clean up temporary IDs from nested arrays before saving
  const cleanedData = { ...caseServiceData };

  // Clean installments - remove _id field for new entries or if it's a temporary ID
  if (cleanedData.installments) {
    cleanedData.installments = cleanedData.installments.map((installment) => {
      // Remove _id if it's a temporary ID (starts with "temp_") or if it's not a valid ObjectId
      if (
        installment._id &&
        (installment._id.toString().startsWith('temp_') ||
          !Types.ObjectId.isValid(installment._id))
      ) {
        const { _id, ...cleanedInstallment } = installment;
        return getReturnData(cleanedInstallment) as InstallmentPlanItem;
      }
      return getReturnData(installment);
    }) as InstallmentPlanItem[];
  }

  // Clean incurred costs - remove _id field for new entries or if it's a temporary ID
  if (cleanedData.incurredCosts) {
    cleanedData.incurredCosts = cleanedData.incurredCosts.map((cost) => {
      // Remove _id if it's a temporary ID (starts with "temp_") or if it's not a valid ObjectId
      if (
        cost._id &&
        (cost._id.toString().startsWith('temp_') ||
          !Types.ObjectId.isValid(cost._id))
      ) {
        const { _id, ...cleanedCost } = cost;
        return getReturnData(cleanedCost) as IncurredCost;
      }
      return getReturnData(cost);
    }) as IncurredCost[];
  }

  // Calculate totals cache
  const totalsCache = calculateTotalsCache(cleanedData);
  cleanedData.totalsCache = totalsCache;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [caseService] = await CaseServiceModel.create(
      [formatAttributeName(cleanedData, CASE_SERVICE.PREFIX)],
      { session }
    );
    if (!caseService) {
      throw new BadRequestError('Không thể tạo Hồ sơ vụ việc');
    }

    // Create tasks from template
    await createTasksFromTemplate('default', caseService, session);

    // If participants are provided, assign them to all created tasks
    if (cleanedData.participants && cleanedData.participants.length > 0) {
      const participantEmployeeIds = cleanedData.participants.map((p) =>
        p.employeeId.toString()
      );

      // Update task assignees after tasks are created
      // Note: We do this after transaction commit to avoid issues
      session.commitTransaction();

      try {
        await updateTaskAssigneesForCase(
          caseService._id.toString(),
          participantEmployeeIds
        );
        console.log(
          `Assigned ${participantEmployeeIds.length} participants to tasks for new case service ${caseService._id}`
        );
      } catch (taskUpdateError) {
        console.error(
          'Error assigning participants to tasks for new case:',
          taskUpdateError
        );
        // Don't fail the whole operation if task assignment fails
      }

      return getReturnData(caseService);
    } else {
      await session.commitTransaction();
      return getReturnData(caseService);
    }
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

    // Clean up temporary IDs from nested arrays before updating
    const cleanedData = { ...data };

    // Clean installments - remove _id field for new entries or if it's a temporary ID
    if (cleanedData.installments) {
      cleanedData.installments = cleanedData.installments.map((installment) => {
        // Remove _id if it's a temporary ID (starts with "temp_") or if it's not a valid ObjectId
        if (
          installment._id &&
          (installment._id.toString().startsWith('temp_') ||
            !Types.ObjectId.isValid(installment._id))
        ) {
          const { _id, ...cleanedInstallment } = installment;
          return getReturnData(cleanedInstallment) as InstallmentPlanItem;
        }
        return getReturnData(installment);
      }) as InstallmentPlanItem[];
    }

    // Clean incurred costs - remove _id field for new entries or if it's a temporary ID
    if (cleanedData.incurredCosts) {
      cleanedData.incurredCosts = cleanedData.incurredCosts.map((cost) => {
        // Remove _id if it's a temporary ID (starts with "temp_") or if it's not a valid ObjectId
        if (
          cost._id &&
          (cost._id.toString().startsWith('temp_') ||
            !Types.ObjectId.isValid(cost._id))
        ) {
          const { _id, ...cleanedCost } = cost;
          return getReturnData(cleanedCost) as IncurredCost;
        }
        return getReturnData(cost);
      }) as IncurredCost[];
    }

    // Calculate totals cache
    const totalsCache = calculateTotalsCache(cleanedData);
    cleanedData!.totalsCache = totalsCache;

    const updatedCaseService = await CaseServiceModel.findByIdAndUpdate(
      id,
      {
        $set: formatAttributeName(
          removeNestedNullish({
            ...cleanedData,
            customer: cleanedData.customer,
            code: cleanedData.code,
            notes: cleanedData.notes,
            status: cleanedData.status,
            startDate: cleanedData.startDate
              ? new Date(cleanedData.startDate).toISOString()
              : undefined,
          }),
          CASE_SERVICE.PREFIX
        ),
      },
      { new: true }
    ).lean();

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

const deleteCaseService = async (id: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const caseService = await CaseServiceModel.findById(id).session(session);
    if (!caseService) {
      throw new NotFoundError('Không tìm thấy Hồ sơ vụ việc');
    }
    // Delete document associations
    await DocumentCaseModel.deleteMany({ caseService: id }, { session });

    // Delete related tasks
    await TaskModel.deleteMany({ tsk_caseService: id }, { session });

    // Delete the case service
    await CaseServiceModel.findByIdAndDelete(id, { session });

    await session.commitTransaction();
    return getReturnData(caseService);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const bulkDeleteCaseServices = async (ids: string[]) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Delete case services
    await CaseServiceModel.deleteMany({ _id: { $in: ids } }, { session });

    // Delete document associations
    await DocumentCaseModel.deleteMany(
      { caseService: { $in: ids } },
      { session }
    );

    // Delete related tasks
    await TaskModel.deleteMany({ tsk_caseService: { $in: ids } }, { session });

    await session.commitTransaction();
    return { success: true, message: 'Bulk delete successful' };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Import case services data from XLSX file
 * @param filePath Path to the Excel file to import
 * @param options Import options
 */
const importCaseServices = async (
  filePath: string,
  options: {
    skipDuplicates?: boolean;
    updateExisting?: boolean;
    skipEmptyRows?: boolean;
  } = {}
) => {
  let session;
  try {
    const {
      skipDuplicates = true,
      updateExisting = false,
      skipEmptyRows = true,
    } = options;

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new BadRequestError('Không tìm thấy file Excel để import');
    }

    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    if (!rawData || rawData.length === 0) {
      throw new BadRequestError(
        'File Excel không có dữ liệu hoặc định dạng không đúng'
      );
    }

    // Start transaction
    session = await mongoose.startSession();
    session.startTransaction();

    const results = {
      total: rawData.length,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [] as Array<{ row: number; error: string; data?: any }>,
    };

    // Process each row
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i] as any;
      const rowNumber = i + 2; // +2 because Excel is 1-indexed and first row is header

      try {
        // Skip empty rows if option is enabled
        if (skipEmptyRows && isEmptyCaseServiceRow(row)) {
          results.skipped++;
          continue;
        }

        // Map Excel columns to case service data
        const caseServiceData = await mapExcelRowToCaseService(row);
        console.log(
          '***************************************************import case service data',
          caseServiceData
        );

        // Validate required fields
        if (!caseServiceData.code) {
          results.errors.push({
            row: rowNumber,
            error: 'Thiếu mã hồ sơ vụ việc',
            data: row,
          });
          continue;
        }

        if (!caseServiceData.customer) {
          results.errors.push({
            row: rowNumber,
            error: 'Thiếu thông tin khách hàng',
            data: row,
          });
          continue;
        }

        // Check for existing case service
        const existingCaseService = await CaseServiceModel.findOne({
          case_code: caseServiceData.code,
        });

        if (existingCaseService) {
          if (skipDuplicates && !updateExisting) {
            results.skipped++;
            continue;
          } else if (updateExisting) {
            // Update existing case service
            await CaseServiceModel.findByIdAndUpdate(
              existingCaseService._id,
              formatAttributeName(
                {
                  customer: caseServiceData.customer,
                  notes: caseServiceData.notes,
                  status: caseServiceData.status,
                  startDate: caseServiceData.startDate,
                  endDate: caseServiceData.endDate,
                },
                CASE_SERVICE.PREFIX
              ),
              { session, new: true }
            );
            results.updated++;
          } else {
            results.errors.push({
              row: rowNumber,
              error: 'Hồ sơ vụ việc đã tồn tại (mã trùng)',
              data: row,
            });
          }
        } else {
          // Create new case service
          const [newCaseService] = await CaseServiceModel.create(
            [
              formatAttributeName(
                {
                  code: caseServiceData.code,
                  customer: caseServiceData.customer,
                  notes: caseServiceData.notes,
                  status: caseServiceData.status,
                  startDate: caseServiceData.startDate,
                  endDate: caseServiceData.endDate,
                },
                CASE_SERVICE.PREFIX
              ),
            ],
            { session }
          );

          if (newCaseService) {
            // Create default tasks for the new case service using the template system
            await createTasksFromTemplate('default', newCaseService, session);
          }
          results.imported++;
        }
      } catch (error) {
        console.log('Error importing case service data:', error);
        results.errors.push({
          row: rowNumber,
          error: error instanceof Error ? error.message : 'Lỗi không xác định',
          data: row,
        });
      }
    }

    console.log(
      '***************************************************import results',
      results
    );

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    return results;
  } catch (error) {
    // Rollback transaction if there's an error
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }

    // Wrap original error with Vietnamese message if it's a standard Error
    if (
      error instanceof Error &&
      !(error instanceof BadRequestError) &&
      !(error instanceof NotFoundError)
    ) {
      throw new Error(
        `Đã xảy ra lỗi khi import dữ liệu hồ sơ vụ việc từ XLSX: ${error.message}`
      );
    }
    throw error;
  } finally {
    // Clean up the uploaded file
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up uploaded file: ${filePath}`);
      }
    } catch (unlinkError) {
      console.error('Error cleaning up uploaded file:', unlinkError);
    }
  }
};

const exportCaseServicesToXLSX = async (query: ICaseServiceQuery = {}) => {
  try {
    // Reuse the same query logic from getCaseServices but get all data for export
    const { data: caseServicesList } = await getCaseServices(query);

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
    const excelData = await Promise.all(
      caseServicesList.map(async (caseService) => {
        // Get assignees for this case service through participants
        let assigneeNames = '';
        try {
          assigneeNames = caseService.case_participants
            .map((p) => p.employeeId)
            .join(', ');
        } catch (error) {
          console.error('Error fetching assignees for case service:', error);
        }

        return {
          'Mã hồ sơ': caseService.case_code || '',
          'Khách hàng': caseService.case_customer
            ? `${caseService.case_customer.cus_firstName} ${caseService.case_customer.cus_lastName}`
            : '',
          'Mã khách hàng': caseService.case_customer?.cus_code || '',
          'Luật sư chính': '',
          'Người được phân công': assigneeNames,
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
      })
    );

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

/**
 * Helper function to check if a case service row is empty
 */
const isEmptyCaseServiceRow = (row: any): boolean => {
  const values = Object.values(row);
  return values.every(
    (value) =>
      value === null ||
      value === undefined ||
      (typeof value === 'string' && value.trim() === '')
  );
};

/**
 * Helper function to map Excel row to case service data
 */
const mapExcelRowToCaseService = async (row: any) => {
  let startDate: string | undefined, endDate: string | undefined;

  // Parse dates
  if (row['Ngày bắt đầu']) {
    try {
      startDate = parse(
        row['Ngày bắt đầu'],
        'dd/MM/yyyy',
        new Date()
      ).toISOString();
    } catch (error) {
      console.warn('Error parsing start date:', error);
    }
  }

  if (row['Ngày kết thúc']) {
    try {
      endDate = parse(
        row['Ngày kết thúc'],
        'dd/MM/yyyy',
        new Date()
      ).toISOString();
    } catch (error) {
      console.warn('Error parsing end date:', error);
    }
  }

  // Find customer by code or name
  let customerId;
  if (row['Mã khách hàng']) {
    const { CustomerModel } = await import('@models/customer.model');
    const customer = await CustomerModel.findOne({
      cus_code: row['Mã khách hàng'],
    });
    customerId = customer?._id;
  } else if (row['Khách hàng']) {
    // Try to find by name if code is not provided
    const { CustomerModel } = await import('@models/customer.model');
    const fullName = row['Khách hàng'].trim();
    const nameParts = fullName.split(' ');
    if (nameParts.length >= 2) {
      const firstName = nameParts[nameParts.length - 1];
      const lastName = nameParts.slice(0, -1).join(' ');

      const customer = await CustomerModel.findOne({
        cus_firstName: firstName,
        cus_lastName: lastName,
      });
      customerId = customer?._id;
    }
  }

  // Find lead attorney by code or name
  if (row['Mã luật sư']) {
    const { EmployeeModel } = await import('@models/employee.model');
    const attorney = await EmployeeModel.findOne({
      emp_code: row['Mã luật sư'],
    });
  } else if (row['Luật sư chính']) {
    // Try to find by name if code is not provided
    const { EmployeeModel } = await import('@models/employee.model');
    const fullName = row['Luật sư chính'].trim();
    const nameParts = fullName.split(' ');
    if (nameParts.length >= 2) {
      const firstName = nameParts[nameParts.length - 1];
      const lastName = nameParts.slice(0, -1).join(' ');

      const attorney = await EmployeeModel.findOne().populate({
        path: 'emp_user',
        match: {
          usr_firstName: firstName,
          usr_lastName: lastName,
        },
      });
    }
  }

  // Find assignees by parsing the assignees string
  let assigneeIds: string[] = [];
  if (row['Người được phân công']) {
    const { EmployeeModel } = await import('@models/employee.model');
    const assigneeNames = row['Người được phân công']
      .split(',')
      .map((name: string) => name.trim())
      .filter((name: string) => name.length > 0);

    for (const fullName of assigneeNames) {
      const nameParts = fullName.split(' ');
      if (nameParts.length >= 2) {
        const firstName = nameParts[nameParts.length - 1];
        const lastName = nameParts.slice(0, -1).join(' ');

        const assignee = await EmployeeModel.findOne().populate({
          path: 'emp_user',
          match: {
            usr_firstName: firstName,
            usr_lastName: lastName,
          },
        });

        if (assignee?.emp_user) {
          assigneeIds.push(assignee._id.toString());
        }
      }
    }
  }

  return {
    code: row['Mã hồ sơ'] || '',
    customer: customerId,
    assignees: assigneeIds,
    notes: row['Ghi chú'] || '',
    status: row['Trạng thái'] || CASE_SERVICE.STATUS.OPEN,
    startDate,
    endDate,
  };
};

/**
 * Get case service overview including totals, installments, participants, etc.
 */
const getCaseServiceOverview = async (caseServiceId: string) => {
  const caseService = await CaseServiceModel.findById(caseServiceId)
    .populate('case_customer', 'cus_name cus_phone cus_email')
    .populate({
      path: 'case_participants.employeeId',
      populate: {
        path: 'emp_user',
        select: 'usr_firstName usr_lastName usr_email',
      },
    })
    .select(
      'case_pricing case_installments case_participants case_incurredCosts case_totalsCache case_status case_startDate case_endDate case_notes'
    )
    .lean();

  if (!caseService) {
    throw new NotFoundError('Case service not found');
  }

  return getReturnData(caseService);
};

/**
 * Helper function to update task assignees for all tasks in a case service
 * @param caseServiceId - The case service ID
 * @param participantEmployeeIds - Array of employee IDs to assign to all tasks
 * @param options - Additional options for the update
 */
const updateTaskAssigneesForCase = async (
  caseServiceId: string,
  participantEmployeeIds: string[],
  options: { skipNotifications?: boolean } = {}
) => {
  try {
    // Find all tasks associated with this case service
    const tasks = await TaskModel.find({ tsk_caseService: caseServiceId });

    if (tasks.length === 0) {
      console.log(`No tasks found for case service ${caseServiceId}`);
      return {
        tasksUpdated: 0,
        totalTasks: 0,
        assignees: participantEmployeeIds,
      };
    }

    // Convert employee IDs to ObjectIds
    const assigneeObjectIds = participantEmployeeIds.map(
      (id) => new Types.ObjectId(id)
    );

    // Update all tasks to have the same assignees as the case participants
    const updateResult = await TaskModel.updateMany(
      { tsk_caseService: caseServiceId },
      {
        $set: {
          tsk_assignees: assigneeObjectIds,
        },
      }
    );

    console.log(
      `Updated ${updateResult.modifiedCount} tasks for case service ${caseServiceId} with ${participantEmployeeIds.length} assignees`
    );

    // Note: We don't call syncAllCaseServiceParticipants here to avoid circular updates
    // since we're updating tasks based on participants, not the other way around

    return {
      tasksUpdated: updateResult.modifiedCount,
      totalTasks: tasks.length,
      assignees: participantEmployeeIds,
    };
  } catch (error) {
    console.error('Error updating task assignees for case:', error);
    throw new Error(
      `Failed to update task assignees for case service: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
};

/**
 * Update case service participants
 * This function updates the case service participants with the provided participants data
 * @param caseServiceId - The case service ID to update participants for
 * @param caseParticipants - Array of CaseParticipant objects to update/add
 * @param userId - The user ID for transaction tracking
 */
const updateCaseServiceParticipant = async (
  caseServiceId: string,
  caseParticipants: CaseParticipant[],
  userId?: string
) => {
  try {
    if (!Types.ObjectId.isValid(caseServiceId)) {
      throw new BadRequestError('Invalid case service ID');
    }

    // Find the case service
    const caseService = await CaseServiceModel.findById(caseServiceId);
    if (!caseService) {
      throw new NotFoundError('Case service not found');
    }

    // Store old participants for comparison
    const oldParticipantIds = caseService.case_participants.map((p) =>
      p.employeeId.toString()
    );

    if (!caseParticipants || caseParticipants.length === 0) {
      // If no participants provided, update tasks to remove all assignees
      await updateTaskAssigneesForCase(caseServiceId, []);

      // Clear participants
      caseService.case_participants = [];
      caseService.case_totalsCache = calculateTotalsCache({
        pricing: caseService.case_pricing,
        installments: caseService.case_installments,
        incurredCosts: caseService.case_incurredCosts,
        participants: caseService.case_participants,
      });
      await caseService.save();

      return {
        success: true,
        message: 'All participants removed and tasks updated',
        participants: caseService.case_participants,
      };
    }

    // Validate participant employee IDs exist
    const participantEmployeeIds = caseParticipants.map((p) =>
      p.employeeId.toString()
    );

    const existingEmployees = await EmployeeModel.find({
      _id: { $in: participantEmployeeIds },
    });

    if (existingEmployees.length !== participantEmployeeIds.length) {
      const foundIds = existingEmployees.map((emp) => emp._id.toString());
      const notFoundIds = participantEmployeeIds.filter(
        (id) => !foundIds.includes(id)
      );
      throw new BadRequestError(
        `Employee(s) not found: ${notFoundIds.join(', ')}`
      );
    }

    // Handle transaction updates for participant commissions if userId is provided
    if (userId) {
      const newParticipants = await updateParticipantTransactions(
        userId,
        caseServiceId,
        caseParticipants,
        caseService.case_participants
      );
      caseService.case_participants = newParticipants;
    } else {
      // Update the case service participants
      caseService.case_participants = caseParticipants;
    }

    caseService.case_totalsCache = calculateTotalsCache({
      pricing: caseService.case_pricing,
      installments: caseService.case_installments,
      incurredCosts: caseService.case_incurredCosts,
      participants: caseService.case_participants,
    });

    await caseService.save();

    // Update task assignees to match the new participants
    await updateTaskAssigneesForCase(caseServiceId, participantEmployeeIds);

    // Determine what changed for better messaging
    const newParticipantIds = participantEmployeeIds;
    const addedIds = newParticipantIds.filter(
      (id) => !oldParticipantIds.includes(id)
    );
    const removedIds = oldParticipantIds.filter(
      (id) => !newParticipantIds.includes(id)
    );

    let message = 'Participants updated successfully';
    if (addedIds.length > 0 && removedIds.length > 0) {
      message = `Participants updated: ${addedIds.length} added, ${removedIds.length} removed. Tasks assignees updated accordingly.`;
    } else if (addedIds.length > 0) {
      message = `${addedIds.length} participant(s) added and assigned to all case tasks.`;
    } else if (removedIds.length > 0) {
      message = `${removedIds.length} participant(s) removed and unassigned from all case tasks.`;
    } else {
      message = 'Participant details updated. Task assignments unchanged.';
    }

    return getReturnData({
      success: true,
      message,
      participants: caseService.case_participants,
      totalParticipants: caseService.case_participants.length,
      changesApplied: {
        added: addedIds.length,
        removed: removedIds.length,
        tasksUpdated: true,
      },
    });
  } catch (error) {
    console.error('Error in updateCaseServiceParticipant:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(
      'Unknown error occurred while updating case service participants'
    );
  }
};

const updateCaseServiceInstallment = async (
  caseId: string,
  payload: InstallmentPlanItem[],
  userId?: string
) => {
  try {
    if (!Types.ObjectId.isValid(caseId)) {
      throw new BadRequestError('Invalid case service ID');
    }

    // Find the case service
    const caseService = await CaseServiceModel.findById(caseId);
    if (!caseService) {
      throw new NotFoundError('Case service not found');
    }

    if (!payload || payload.length === 0) {
      return {
        success: true,
        message: 'No installments provided to update',
        installments: caseService.case_installments,
      };
    }

    // Clean up temporary IDs from installments before updating
    const cleanedInstallments = payload.map((installment) => {
      if (installment.id) {
        const { id, ...cleanedInstallment } = installment;
        return getReturnData(cleanedInstallment) as InstallmentPlanItem;
      }
      return getReturnData(installment);
    }) as InstallmentPlanItem[];

    // Update the case service installments
    caseService.case_installments = cleanedInstallments;

    // Handle transaction updates for installments if userId is provided
    if (userId) {
      const installmentsWithTransactionIds =
        await updateInstallmentTransactions(
          userId,
          caseId,
          cleanedInstallments,
          caseService.case_installments
        );
      caseService.case_installments = installmentsWithTransactionIds;
    }

    // Recalculate totals cache with updated installments
    caseService.case_totalsCache = calculateTotalsCache({
      pricing: caseService.case_pricing,
      installments: caseService.case_installments,
      incurredCosts: caseService.case_incurredCosts,
      participants: caseService.case_participants,
    });

    await caseService.save();

    return getReturnData({
      success: true,
      message: 'Installments updated successfully',
      installments: caseService.case_installments,
      totalInstallments: caseService.case_installments.length,
      totalsCache: caseService.case_totalsCache,
    });
  } catch (error) {
    console.error('Error in updateCaseServiceInstallment:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(
      'Unknown error occurred while updating case service installments'
    );
  }
};

const updateCaseServiceIncurredCost = async (
  caseId: string,
  payload: IncurredCost[],
  userId?: string
) => {
  try {
    if (!Types.ObjectId.isValid(caseId)) {
      throw new BadRequestError('Invalid case service ID');
    }

    // Find the case service
    const caseService = await CaseServiceModel.findById(caseId);
    if (!caseService) {
      throw new NotFoundError('Case service not found');
    }

    if (!payload || payload.length === 0) {
      return {
        success: true,
        message: 'No incurred costs provided to update',
        incurredCosts: caseService.case_incurredCosts,
      };
    }

    // Clean up temporary IDs from incurred costs before updating
    const cleanedIncurredCosts = payload.map((cost) => {
      // Remove _id if it's a temporary ID (starts with "temp_") or if it's not a valid ObjectId
      if (cost.id) {
        const { id, ...cleanedCost } = cost;
        return getReturnData(cleanedCost) as IncurredCost;
      }
      return getReturnData(cost);
    }) as IncurredCost[];

    // Update the case service incurred costs
    caseService.case_incurredCosts = cleanedIncurredCosts;

    // Handle transaction updates for incurred costs if userId is provided
    if (userId) {
      const incurredCostWithTransactionIds =
        await updateIncurredCostTransactions(
          userId,
          caseId,
          cleanedIncurredCosts,
          caseService.case_incurredCosts
        );

      caseService.case_incurredCosts = incurredCostWithTransactionIds;
    }

    // Recalculate totals cache with updated incurred costs
    caseService.case_totalsCache = calculateTotalsCache({
      pricing: caseService.case_pricing,
      installments: caseService.case_installments,
      incurredCosts: caseService.case_incurredCosts,
      participants: caseService.case_participants,
    });

    await caseService.save();

    return getReturnData({
      success: true,
      message: 'Incurred costs updated successfully',
      incurredCosts: caseService.case_incurredCosts,
      totalIncurredCosts: caseService.case_incurredCosts.length,
      totalsCache: caseService.case_totalsCache,
    });
  } catch (error) {
    console.error('Error in updateCaseServiceIncurredCost:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(
      'Unknown error occurred while updating case service incurred costs'
    );
  }
};

// Helper functions for managing transaction records
const createTransactionRecord = async (
  userId: string,
  caseServiceId: string,
  transactionData: {
    title: string;
    type: 'income' | 'outcome';
    amount: number;
    category: string;
    description?: string;
    paymentMethod?: string;
  }
) => {
  try {
    const employee = await getEmployeeByUserId(userId);
    const transaction = await createTransaction(userId, {
      title: transactionData.title,
      type: transactionData.type as any,
      amount: transactionData.amount,
      paymentMethod: (transactionData.paymentMethod ||
        TRANSACTION.PAYMENT_METHOD.BANK_TRANSFER) as any,
      category: transactionData.category as any,
      description: transactionData.description,
      caseService: caseServiceId,
      date: new Date().toISOString(),
    });
    return transaction.id;
  } catch (error) {
    console.error('Error creating transaction record:', error);
    throw error;
  }
};

const updateTransactionRecord = async (
  transactionId: string,
  updateData: {
    title?: string;
    type?: 'income' | 'outcome';
    amount?: number;
    category?: string;
    description?: string;
    paymentMethod?: string;
  }
) => {
  try {
    if (!transactionId || !Types.ObjectId.isValid(transactionId)) {
      console.warn(
        'Invalid transaction ID provided for update:',
        transactionId
      );
      return;
    }
    await updateTransaction(transactionId, {
      ...updateData,
      type: updateData.type as any,
      category: updateData.category as any,
      paymentMethod: updateData.paymentMethod as any,
    });
  } catch (error) {
    console.error('Error updating transaction record:', error);
    // Don't throw error to avoid breaking the main case service update
    console.warn(
      'Transaction update failed, continuing with case service update'
    );
  }
};

const deleteTransactionRecord = async (transactionId: string) => {
  try {
    if (!transactionId || !Types.ObjectId.isValid(transactionId)) {
      console.warn(
        'Invalid transaction ID provided for deletion:',
        transactionId
      );
      return;
    }
    await deleteTransaction(transactionId);
  } catch (error) {
    console.error('Error deleting transaction record:', error);
    // Don't throw error to avoid breaking the main case service operation
    console.warn(
      'Transaction deletion failed, continuing with case service operation'
    );
  }
};

// Enhanced case service functions with transaction handling
const createCaseServiceWithTransactions = async (
  userId: string,
  caseServiceData: ICaseServiceCreate
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Create the case service first
    const caseService = await createCaseService(caseServiceData);

    // Create transaction records for financial components
    const transactionIds = {
      installments: [] as string[],
      incurredCosts: [] as string[],
      taxes: [] as string[],
      commissions: [] as string[],
    };

    // Create transactions for installments
    if (
      caseServiceData.installments &&
      caseServiceData.installments.length > 0
    ) {
      for (const installment of caseServiceData.installments) {
        const transactionId = await createTransactionRecord(
          userId,
          caseService.id,
          {
            title: `Đợt thanh toán - ${caseService.case_code} (Seq: ${installment.seq})`,
            type: 'income',
            amount: installment.amount,
            category: TRANSACTION.CATEGORY.INCOME.INSTALLMENT_PAYMENT.value,
            description: `Đợt thanh toán ${installment.seq} cho vụ việc ${
              caseService.case_code
            }. Hạn chót: ${new Date(installment.dueDate).toLocaleDateString()}`,
            paymentMethod: TRANSACTION.PAYMENT_METHOD.BANK_TRANSFER,
          }
        );
        transactionIds.installments.push(transactionId);

        // Update the installment with transaction ID
        installment.transactionId = transactionId;
      }
    }

    // Create transactions for incurred costs
    if (
      caseServiceData.incurredCosts &&
      caseServiceData.incurredCosts.length > 0
    ) {
      for (const cost of caseServiceData.incurredCosts) {
        const transactionId = await createTransactionRecord(
          userId,
          caseService.id,
          {
            title: `Chi phí phát sinh - ${caseService.case_code}`,
            type: 'outcome',
            amount: cost.amount,
            category: TRANSACTION.CATEGORY.OUTCOME.OPERATIONAL_EXPENSE.value,
            description: `${
              cost.description ||
              Object.values(TRANSACTION.CATEGORY.OUTCOME).find(
                (cat) => cat.value === cost.category
              )?.label
            } cho vụ việc ${caseService.case_code}`,
            paymentMethod: TRANSACTION.PAYMENT_METHOD.BANK_TRANSFER,
          }
        );
        transactionIds.incurredCosts.push(transactionId);

        // Update the incurred cost with transaction ID
        cost.transactionId = transactionId;
      }
    }

    // Create transactions for taxes
    if (
      caseServiceData.pricing?.taxes &&
      caseServiceData.pricing.taxes.length > 0
    ) {
      for (const tax of caseServiceData.pricing.taxes) {
        const taxAmount =
          tax.mode === 'PERCENT'
            ? (caseServiceData.pricing.baseAmount * tax.value) / 100
            : tax.value;

        const transactionId = await createTransactionRecord(
          userId,
          caseService.id,
          {
            title: `Thuế - ${tax.name}`,
            type: 'outcome',
            amount: taxAmount,
            category: TRANSACTION.CATEGORY.OUTCOME.TAX_PAYMENT.value,
            description: `${tax.name} cho vụ việc ${caseService.case_code}`,
            paymentMethod: TRANSACTION.PAYMENT_METHOD.BANK_TRANSFER,
          }
        );

        // Update the tax with transaction ID
        tax.transactionId = transactionId;
      }
    }

    // Create transactions for commissions
    if (
      caseServiceData.participants &&
      caseServiceData.participants.length > 0
    ) {
      for (const participant of caseServiceData.participants) {
        if (participant.commission) {
          let commissionAmount = 0;
          const baseAmount = caseServiceData.pricing?.baseAmount || 0;

          switch (participant.commission.type) {
            case 'PERCENT_OF_GROSS':
              commissionAmount =
                (baseAmount * participant.commission.value) / 100;
              break;
            case 'PERCENT_OF_NET':
              // Calculate net amount (this is simplified, in reality would need full calculation)
              const netAmount = baseAmount;
              commissionAmount =
                (netAmount * participant.commission.value) / 100;
              break;
            case 'FLAT':
              commissionAmount = participant.commission.value;
              break;
          }

          const transactionId = await createTransactionRecord(
            userId,
            caseService.id,
            {
              title: `Hoa hồng - ${caseService.case_code}`,
              type: 'outcome',
              amount: commissionAmount,
              category: TRANSACTION.CATEGORY.OUTCOME.COMMISSION_PAYMENT.value,
              description: `Hoa hồng cho trong vụ việc ${caseService.case_code}`,
              paymentMethod: TRANSACTION.PAYMENT_METHOD.BANK_TRANSFER,
            }
          );

          // Update the participant commission with transaction ID
          participant.commission.transactionId = transactionId;
        }
      }
    }

    console.log(
      '---------------------------------------updating case service: ',
      caseServiceData
    );

    // Update the case service with transaction IDs
    await updateCaseService(caseService.id, {
      installments: caseServiceData.installments,
      incurredCosts: caseServiceData.incurredCosts,
      pricing: caseServiceData.pricing,
      participants: caseServiceData.participants,
    });

    await session.commitTransaction();
    return caseService;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const updateCaseServiceWithTransactions = async (
  userId: string,
  id: string,
  data: ICaseServiceUpdate,
  originalCaseService?: any
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Get the original case service if not provided
    if (!originalCaseService) {
      originalCaseService = await CaseServiceModel.findById(id);
      if (!originalCaseService) {
        throw new NotFoundError('Case service not found');
      }
    }

    // Update installments transactions
    if (data.installments) {
      await updateInstallmentTransactions(
        userId,
        id,
        data.installments,
        originalCaseService.case_installments
      );
    }

    // Update incurred costs transactions
    if (data.incurredCosts) {
      await updateIncurredCostTransactions(
        userId,
        id,
        data.incurredCosts,
        originalCaseService.case_incurredCosts
      );
    }

    // Update pricing/tax transactions
    if (data.pricing) {
      await updatePricingTransactions(
        userId,
        id,
        data.pricing,
        originalCaseService.case_pricing
      );
    }

    // Update participant commission transactions
    if (data.participants) {
      await updateParticipantTransactions(
        userId,
        id,
        data.participants,
        originalCaseService.case_participants
      );
    }

    // Update the case service
    const updatedCaseService = await updateCaseService(id, data);

    await session.commitTransaction();
    return updatedCaseService;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const updateInstallmentTransactions = async (
  userId: string,
  caseServiceId: string,
  newInstallments: InstallmentPlanItem[],
  originalInstallments: InstallmentPlanItem[]
) => {
  // Create maps for easy lookup
  const originalMap = new Map(
    originalInstallments.map((item) => [item._id, item])
  );
  const newMap = new Map(newInstallments.map((item) => [item._id, item]));

  // Handle deletions
  for (const original of originalInstallments) {
    if (!newMap.has(original._id) && original.transactionId) {
      await deleteTransactionRecord(original.transactionId.toString());
    }
  }

  // Handle additions and updates
  for (const newItem of newInstallments) {
    const original = originalMap.get(newItem._id);

    if (!original) {
      // New installment - create transaction
      const transactionId = await createTransactionRecord(
        userId,
        caseServiceId,
        {
          title: `Đợt giao dịch - STT: ${newItem.seq}`,
          type: 'income',
          amount: newItem.amount,
          category: TRANSACTION.CATEGORY.INCOME.INSTALLMENT_PAYMENT.value,
          description: `Đợt giao dịch - STT: ${
            newItem.seq
          }. Hạn chót: ${new Date(newItem.dueDate).toLocaleDateString()}`,
          paymentMethod: TRANSACTION.PAYMENT_METHOD.BANK_TRANSFER,
        }
      );
      newItem.transactionId = transactionId;
    } else if (
      original.amount !== newItem.amount ||
      original.dueDate !== newItem.dueDate
    ) {
      // Updated installment - update transaction
      if (original.transactionId) {
        await updateTransactionRecord(original.transactionId.toString(), {
          title: `Đợt giao dịch - STT: ${newItem.seq}`,
          amount: newItem.amount,
          description: `Đợt giao dịch - STT: ${
            newItem.seq
          }. Hạn chót: ${new Date(newItem.dueDate).toLocaleDateString()}`,
        });
        newItem.transactionId = original.transactionId;
      }
    } else {
      // No changes - keep existing transaction ID
      newItem.transactionId = original.transactionId;
    }
  }

  return Array.from(newMap.values());
};

const updateIncurredCostTransactions = async (
  userId: string,
  caseServiceId: string,
  newCosts: IncurredCost[],
  originalCosts: IncurredCost[]
) => {
  const originalMap = new Map(originalCosts.map((item) => [item._id, item]));
  const newMap = new Map(newCosts.map((item) => [item._id, item]));

  // Handle deletions
  for (const original of originalCosts) {
    if (!newMap.has(original._id) && original.transactionId) {
      await deleteTransactionRecord(original.transactionId.toString());
    }
  }

  // Handle additions and updates
  for (const newItem of newCosts) {
    const original = originalMap.get(newItem._id);

    if (!original) {
      // New cost - create transaction
      const transactionId = await createTransactionRecord(
        userId,
        caseServiceId,
        {
          title: `Chi phí - ${
            Object.values(TRANSACTION.CATEGORY.OUTCOME).find(
              (cat) => cat.value === newItem.category
            )?.label
          }`,
          type: 'outcome',
          amount: newItem.amount,
          category: TRANSACTION.CATEGORY.OUTCOME.OPERATIONAL_EXPENSE.value,
          description:
            newItem.description ||
            Object.values(TRANSACTION.CATEGORY.OUTCOME).find(
              (cat) => cat.value === newItem.category
            )?.label,
          paymentMethod: TRANSACTION.PAYMENT_METHOD.BANK_TRANSFER,
        }
      );
      newItem.transactionId = transactionId;
    } else if (
      original.amount !== newItem.amount ||
      original.category !== newItem.category
    ) {
      // Updated cost - update transaction
      if (original.transactionId) {
        await updateTransactionRecord(original.transactionId.toString(), {
          title: `Chi phí - ${
            Object.values(TRANSACTION.CATEGORY.OUTCOME).find(
              (cat) => cat.value === newItem.category
            )?.label
          }`,
          amount: newItem.amount,
          description:
            newItem.description ||
            Object.values(TRANSACTION.CATEGORY.OUTCOME).find(
              (cat) => cat.value === newItem.category
            )?.label,
        });
        newItem.transactionId = original.transactionId;
      }
    } else {
      // No changes - keep existing transaction ID
      newItem.transactionId = original.transactionId;
    }
  }

  return Array.from(new Map([...originalMap, ...newMap]).values());
};

const updatePricingTransactions = async (
  userId: string,
  caseServiceId: string,
  newPricing: ICaseServiceCreate['pricing'],
  originalPricing: ICaseServiceCreate['pricing']
) => {
  if (!newPricing?.taxes || !originalPricing?.taxes) {
    return;
  }

  const originalTaxes = originalPricing.taxes || [];
  const newTaxes = newPricing.taxes || [];

  // Handle deletions - find taxes that exist in original but not in new
  for (let i = 0; i < originalTaxes.length; i++) {
    const originalTax = originalTaxes[i];
    const exists = newTaxes.some((newTax, j) => j === i);

    if (!exists && (originalTax as any).transactionId) {
      await deleteTransactionRecord(
        (originalTax as any).transactionId.toString()
      );
    }
  }

  // Handle additions and updates
  for (let i = 0; i < newTaxes.length; i++) {
    const newTax = newTaxes[i];
    const originalTax = originalTaxes[i];

    const taxAmount =
      newTax.mode === 'PERCENT'
        ? (newPricing.baseAmount * newTax.value) / 100
        : newTax.value;

    if (!originalTax) {
      // New tax - create transaction
      const transactionId = await createTransactionRecord(
        userId,
        caseServiceId,
        {
          title: `Thuế - ${newTax.name}`,
          type: 'outcome',
          amount: taxAmount,
          category: TRANSACTION.CATEGORY.OUTCOME.TAX_PAYMENT.value,
          description: `${newTax.name}`,
          paymentMethod: TRANSACTION.PAYMENT_METHOD.BANK_TRANSFER,
        }
      );
      (newTax as any).transactionId = transactionId;
    } else {
      // Check if tax amount changed
      const originalTaxAmount =
        originalTax.mode === 'PERCENT'
          ? (originalPricing.baseAmount * originalTax.value) / 100
          : originalTax.value;

      if (originalTaxAmount !== taxAmount || originalTax.name !== newTax.name) {
        // Updated tax - update transaction
        if ((originalTax as any).transactionId) {
          await updateTransactionRecord(
            (originalTax as any).transactionId.toString(),
            {
              title: `Thuế - ${newTax.name}`,
              amount: taxAmount,
              description: `${newTax.name}`,
            }
          );
          (newTax as any).transactionId = (originalTax as any).transactionId;
        }
      } else {
        // No changes - keep existing transaction ID
        (newTax as any).transactionId = (originalTax as any).transactionId;
      }
    }
  }
};

const updateParticipantTransactions = async (
  userId: string,
  caseServiceId: string,
  newParticipants: CaseParticipant[],
  originalParticipants: CaseParticipant[]
) => {
  const originalMap = new Map(
    originalParticipants.map((item) => [item.employeeId.toString(), item])
  );
  const newMap = new Map(
    newParticipants.map((item) => [item.employeeId.toString(), item])
  );
  const caseService = await getCaseServiceById(caseServiceId, userId);

  // Handle deletions
  for (const original of originalParticipants) {
    if (
      !newMap.has(original.employeeId.toString()) &&
      original.commission?.transactionId
    ) {
      await deleteTransactionRecord(
        original.commission.transactionId.toString()
      );
    }
  }

  // Handle additions and updates
  for (const newItem of newParticipants) {
    if (!newItem.commission) continue;

    const original = originalMap.get(newItem.employeeId.toString());

    // Calculate commission amount (simplified)
    let commissionAmount = 0;
    switch (newItem.commission.type) {
      case 'FLAT':
        commissionAmount = newItem.commission.value;
        break;
      case 'PERCENT_OF_GROSS':
      case 'PERCENT_OF_NET':
        // This would need access to pricing info for accurate calculation
        commissionAmount =
          ((caseService.case_pricing?.baseAmount || 0) *
            newItem.commission.value) /
          100; // Simplified
        break;
    }

    if (!original || !original.commission) {
      // New participant commission - create transaction
      const transactionId = await createTransactionRecord(
        userId,
        caseServiceId,
        {
          title: `Hoa hồng - ${caseService.case_code}`,
          type: 'outcome',
          amount: commissionAmount,
          category: TRANSACTION.CATEGORY.OUTCOME.COMMISSION_PAYMENT.value,
          description: `Hoa hồng cho ${newItem.role || 'nhân viên'}`,
          paymentMethod: TRANSACTION.PAYMENT_METHOD.BANK_TRANSFER,
        }
      );
      newItem.commission.transactionId = transactionId;
    } else {
      // Check if commission changed
      const originalCommissionAmount = original.commission.value;

      if (
        originalCommissionAmount !== newItem.commission.value ||
        original.commission.type !== newItem.commission.type
      ) {
        // Updated commission - update transaction
        if (original.commission.transactionId) {
          await updateTransactionRecord(
            original.commission.transactionId.toString(),
            {
              title: `Hoa hồng - ${caseService.case_code}`,
              amount: commissionAmount,
              description: `Hoa hồng cho ${newItem.role || 'nhân viên'}`,
            }
          );
          newItem.commission.transactionId = original.commission.transactionId;
        }
      } else {
        // No changes - keep existing transaction ID
        newItem.commission.transactionId = original.commission.transactionId;
      }
    }
  }

  return Array.from(newMap.values());
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
  getCaseServiceOverview,
  updateCaseServiceParticipant,
  updateCaseServiceInstallment,
  updateCaseServiceIncurredCost,
  updateTaskAssigneesForCase,
  // New transaction-aware functions
  createCaseServiceWithTransactions,
  updateCaseServiceWithTransactions,
};
