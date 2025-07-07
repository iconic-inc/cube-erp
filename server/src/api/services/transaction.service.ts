import mongoose, { Types } from 'mongoose';
import {
  ITransactionCreate,
  ITransactionQuery,
  ITransactionUpdate,
  ITransactionResponse,
} from '../interfaces/transaction.interface';
import { BadRequestError, NotFoundError } from '../core/errors';
import {
  getReturnList,
  getReturnData,
  formatAttributeName,
  removeNestedNullish,
} from '@utils/index';
import { TransactionModel } from '@models/transaction.model';
import { TRANSACTION } from '../constants/transaction.constant';
import { getEmployeeByUserId } from './employee.service';
import { CASE_SERVICE } from '@constants/caseService.constant';
import { CUSTOMER } from '@constants/customer.constant';
import { USER } from '@constants/user.constant';

// Import modules for export functionality
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { serverConfig } from '@configs/config.server';

const getTransactions = async (
  query: ITransactionQuery = {}
): Promise<{
  data: ITransactionResponse[];
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
      type,
      paymentMethod,
      category,
      startDate,
      endDate,
      customerId,
      caseServiceId,
      createdById,
      amountMin,
      amountMax,
    } = query;

    // Build the aggregation pipeline
    const pipeline: any[] = [];

    // Stage 1: Match by filters
    const matchConditions: any = {};

    // Add type filter if provided
    if (type) {
      matchConditions.tx_type =
        type === 'all' ? { $in: ['income', 'outcome'] } : type;
    }

    // Add payment method filter if provided
    if (paymentMethod) {
      matchConditions.tx_paymentMethod = paymentMethod;
    }

    // Add category filter if provided
    if (category) {
      matchConditions.tx_category = category;
    }

    // Add customer filter if provided
    if (customerId) {
      matchConditions.tx_customer = new Types.ObjectId(customerId);
    }

    // Add case service filter if provided
    if (caseServiceId) {
      matchConditions.tx_caseService = new Types.ObjectId(caseServiceId);
    }

    // Add created by filter if provided
    if (createdById) {
      matchConditions.tx_createdBy = new Types.ObjectId(createdById);
    }

    // Add amount range filters if provided
    if (amountMin !== undefined || amountMax !== undefined) {
      matchConditions.tx_amount = {};
      if (amountMin !== undefined) {
        matchConditions.tx_amount.$gte = amountMin;
      }
      if (amountMax !== undefined) {
        matchConditions.tx_amount.$lte = amountMax;
      }
    }

    // Add date range filters if provided
    if (startDate || endDate) {
      matchConditions.tx_date = {};
      if (startDate) {
        matchConditions.tx_date.$gte = new Date(startDate);
      }
      if (endDate) {
        matchConditions.tx_date.$lte = new Date(endDate);
      }
    }

    // Add match stage if we have any conditions
    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }

    // Stage 2: Lookup createdBy employee information
    pipeline.push({
      $lookup: {
        from: USER.EMPLOYEE.COLLECTION_NAME,
        localField: 'tx_createdBy',
        foreignField: '_id',
        as: 'tx_createdBy',
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

    // Stage 3: Lookup customer information
    pipeline.push({
      $lookup: {
        from: CUSTOMER.COLLECTION_NAME,
        localField: 'tx_customer',
        foreignField: '_id',
        as: 'tx_customer',
      },
    });

    // Stage 4: Lookup case service information
    pipeline.push({
      $lookup: {
        from: CASE_SERVICE.COLLECTION_NAME,
        localField: 'tx_caseService',
        foreignField: '_id',
        as: 'tx_caseService',
        pipeline: [
          {
            $lookup: {
              from: CUSTOMER.COLLECTION_NAME,
              localField: 'case_customer',
              foreignField: '_id',
              as: 'case_customer',
            },
          },
          {
            $unwind: {
              path: '$case_customer',
              preserveNullAndEmptyArrays: true,
            },
          },
        ],
      },
    });

    // Stage 5: Unwind the arrays to work with single documents
    pipeline.push({
      $unwind: { path: '$tx_createdBy', preserveNullAndEmptyArrays: true },
    });
    pipeline.push({
      $unwind: { path: '$tx_customer', preserveNullAndEmptyArrays: true },
    });
    pipeline.push({
      $unwind: { path: '$tx_caseService', preserveNullAndEmptyArrays: true },
    });

    // Stage 6: Add search filter if provided (after lookups for better search)
    if (search) {
      const searchRegex = new RegExp(search, 'i'); // Case-insensitive search
      pipeline.push({
        $match: {
          $or: [
            { tx_code: searchRegex },
            { tx_title: searchRegex },
            { tx_description: searchRegex },
            { 'tx_customer.cus_firstName': searchRegex },
            { 'tx_customer.cus_lastName': searchRegex },
            { 'tx_customer.cus_code': searchRegex },
            { 'tx_createdBy.emp_user.usr_firstName': searchRegex },
            { 'tx_createdBy.emp_user.usr_lastName': searchRegex },
            { 'tx_createdBy.emp_user.usr_username': searchRegex },
            { 'tx_caseService.case_code': searchRegex },
          ],
        },
      });
    }

    // Stage 7: Add computed fields
    pipeline.push({
      $addFields: {
        tx_remain: { $subtract: ['$tx_amount', '$tx_paid'] },
      },
    });

    // Stage 8: Project to include only necessary fields and transform to match ITransactionResponse
    pipeline.push({
      $project: {
        _id: 1,
        tx_code: 1,
        tx_type: 1,
        tx_title: 1,
        tx_amount: 1,
        tx_paid: 1,
        tx_remain: 1,
        tx_paymentMethod: 1,
        tx_category: 1,
        tx_description: 1,
        tx_date: 1,
        tx_createdBy: {
          _id: 1,
          emp_code: 1,
          emp_position: 1,
          emp_department: 1,
          emp_user: {
            _id: 1,
            usr_username: 1,
            usr_email: 1,
            usr_firstName: 1,
            usr_lastName: 1,
          },
        },
        tx_customer: {
          _id: 1,
          cus_firstName: 1,
          cus_lastName: 1,
          cus_code: 1,
        },
        tx_caseService: {
          _id: 1,
          case_code: 1,
          case_status: 1,
          case_customer: {
            _id: 1,
            cus_firstName: 1,
            cus_lastName: 1,
          },
        },
        createdAt: 1,
        updatedAt: 1,
      },
    });

    // Stage 9: Sort the results
    const sortField = sortBy ? `${sortBy}` : 'tx_date';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    pipeline.push({
      $sort: { [sortField]: sortDirection },
    });

    // Get total count first (for pagination)
    const countPipeline = [...pipeline]; // Clone the pipeline
    countPipeline.push({ $count: 'total' });
    const countResult = await TransactionModel.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Stage 10: Apply pagination
    pipeline.push({ $skip: (page - 1) * limit });
    pipeline.push({ $limit: +limit });

    // Execute the aggregation
    const transactions = await TransactionModel.aggregate(pipeline);
    const totalPages = Math.ceil(total / limit);

    return {
      data: getReturnList(transactions) as ITransactionResponse[],
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
        `Đã xảy ra lỗi khi lấy danh sách giao dịch: ${error.message}`
      );
    }
    throw error;
  }
};

const getTransactionById = async (
  id: string
): Promise<ITransactionResponse> => {
  try {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestError('ID giao dịch không hợp lệ');
    }

    const transaction = await TransactionModel.findById(id)
      .populate({
        path: 'tx_createdBy',
        select: 'emp_code emp_user emp_position emp_department',
        populate: {
          path: 'emp_user',
          select: 'usr_firstName usr_lastName usr_email',
        },
      })
      .populate('tx_customer', 'cus_code cus_firstName cus_lastName')
      .populate({
        path: 'tx_caseService',
        select: 'case_code case_status',
        populate: {
          path: 'case_customer',
          select: 'cus_firstName cus_lastName',
        },
      })
      .lean();

    if (!transaction) {
      throw new NotFoundError('Không tìm thấy giao dịch');
    }

    return getReturnData(transaction) as unknown as ITransactionResponse;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof BadRequestError) {
      throw error;
    }
    throw new BadRequestError(`Error fetching transaction: ${error}`);
  }
};

const createTransaction = async (
  userId: string,
  data: ITransactionCreate
): Promise<ITransactionResponse> => {
  try {
    // Validate that createdBy employee exists
    const employee = await getEmployeeByUserId(userId);

    // Set default paid amount if not provided
    if (data.paid === undefined) {
      data.paid = 0;
    }

    // Validate that paid amount doesn't exceed total amount
    if (data.paid > data.amount) {
      throw new BadRequestError(
        'Số tiền đã thanh toán không được vượt quá tổng số tiền'
      );
    }

    // Create the transaction
    const transaction = await TransactionModel.build({
      ...data,
      createdBy: employee.id,
    });
    await transaction.save();

    // Return the created transaction with populated fields
    return await getTransactionById(transaction.id);
  } catch (error) {
    if (error instanceof BadRequestError) {
      throw error;
    }
    throw new BadRequestError(`Error creating transaction: ${error}`);
  }
};

const updateTransaction = async (
  id: string,
  data: ITransactionUpdate
): Promise<ITransactionResponse> => {
  try {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestError('ID giao dịch không hợp lệ');
    }

    // Check if transaction exists
    const existingTransaction = await TransactionModel.findById(id);
    if (!existingTransaction) {
      throw new NotFoundError('Không tìm thấy giao dịch');
    }

    // Validate employee if createdBy is being updated
    if (data.createdBy) {
      await getEmployeeByUserId(data.createdBy);
    }

    // Validate paid amount if being updated
    const finalAmount = data.amount ?? existingTransaction.tx_amount;
    const finalPaid = data.paid ?? existingTransaction.tx_paid;

    if (finalPaid > finalAmount) {
      throw new BadRequestError(
        'Số tiền đã thanh toán không được vượt quá tổng số tiền'
      );
    }

    // Remove undefined values and format attributes
    const cleanData = removeNestedNullish(data);
    const formattedData = formatAttributeName(
      cleanData as any,
      TRANSACTION.PREFIX
    );

    // Update the transaction
    const updatedTransaction = await TransactionModel.findByIdAndUpdate(
      id,
      formattedData,
      { new: true, runValidators: true }
    );

    if (!updatedTransaction) {
      throw new NotFoundError('Không tìm thấy giao dịch');
    }

    // Return the updated transaction with populated fields
    return await getTransactionById(id);
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof BadRequestError) {
      throw error;
    }
    throw new BadRequestError(`Error updating transaction: ${error}`);
  }
};

const deleteTransaction = async (
  id: string
): Promise<{ deletedCount: number }> => {
  try {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestError('ID giao dịch không hợp lệ');
    }

    const result = await TransactionModel.findByIdAndDelete(id);

    if (!result) {
      throw new NotFoundError('Không tìm thấy giao dịch');
    }

    return { deletedCount: 1 };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof BadRequestError) {
      throw error;
    }
    throw new BadRequestError(`Error deleting transaction: ${error}`);
  }
};

const bulkDeleteTransactions = async (
  transactionIds: string[]
): Promise<{ deletedCount: number }> => {
  try {
    // Validate all IDs
    for (const id of transactionIds) {
      if (!mongoose.isValidObjectId(id)) {
        throw new BadRequestError(`ID giao dịch không hợp lệ: ${id}`);
      }
    }

    const objectIds = transactionIds.map((id) => new Types.ObjectId(id));
    const result = await TransactionModel.deleteMany({
      _id: { $in: objectIds },
    });

    return { deletedCount: result.deletedCount || 0 };
  } catch (error) {
    if (error instanceof BadRequestError) {
      throw error;
    }
    throw new BadRequestError(`Error bulk deleting transactions: ${error}`);
  }
};

// Export transactions to XLSX
const exportTransactionsToXLSX = async (query: ITransactionQuery = {}) => {
  try {
    // Reuse the same query logic from getTransactions but get all data for export
    const { data: transactions } = await getTransactions({
      ...query,
      page: 1,
      limit: Number.MAX_SAFE_INTEGER, // Get all records for export
    });

    // Create directory if it doesn't exist
    const exportDir = path.join(process.cwd(), 'public', 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    } else {
      // Clean up old transaction export files
      for (const file of fs.readdirSync(exportDir)) {
        if (file.startsWith('giao_dich_') && file.endsWith('.xlsx')) {
          fs.unlinkSync(path.join(exportDir, file));
        }
      }
    }

    // Create timestamp for unique filename
    const timestamp = new Date().getTime();
    const fileName = `giao_dich_${new Date()
      .toLocaleDateString('vi-VN')
      .split('/')
      .join('-')}_${timestamp}.xlsx`;
    const filePath = path.join(exportDir, fileName);

    // Map transaction data for Excel
    const excelData = transactions.map((transaction) => {
      return {
        'Mã giao dịch': transaction.tx_code || '',
        Loại:
          transaction.tx_type === 'income'
            ? 'Thu'
            : transaction.tx_type === 'outcome'
            ? 'Chi'
            : 'Công nợ',
        'Tiêu đề': transaction.tx_title || '',
        'Số tiền': transaction.tx_amount || 0,
        'Đã thanh toán': transaction.tx_paid || 0,
        'Còn nợ': (transaction.tx_amount || 0) - (transaction.tx_paid || 0),
        'Phương thức thanh toán': transaction.tx_paymentMethod || '',
        'Danh mục': transaction.tx_category || '',
        'Mô tả': transaction.tx_description || '',
        'Người tạo': transaction.tx_createdBy
          ? `${transaction.tx_createdBy.emp_user?.usr_firstName || ''} ${
              transaction.tx_createdBy.emp_user?.usr_lastName || ''
            }`.trim()
          : '',
        'Mã nhân viên': transaction.tx_createdBy?.emp_code || '',
        'Khách hàng': transaction.tx_customer
          ? `${transaction.tx_customer.cus_firstName || ''} ${
              transaction.tx_customer.cus_lastName || ''
            }`.trim()
          : '',
        'Mã khách hàng': transaction.tx_customer?.cus_code || '',
        'Hồ sơ vụ việc': transaction.tx_caseService?.case_code || '',
        'Ngày giao dịch': transaction.tx_date
          ? new Date(transaction.tx_date).toLocaleDateString('vi-VN')
          : '',
        'Thời gian tạo': transaction.createdAt
          ? new Date(transaction.createdAt).toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
          : '',
        'Cập nhật lần cuối': transaction.updatedAt
          ? new Date(transaction.updatedAt).toLocaleDateString('vi-VN', {
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
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Giao dịch');

    // Set column widths for better readability
    const colWidths = [
      { wch: 15 }, // Mã giao dịch
      { wch: 10 }, // Loại
      { wch: 25 }, // Tiêu đề
      { wch: 15 }, // Số tiền
      { wch: 15 }, // Đã thanh toán
      { wch: 15 }, // Còn nợ
      { wch: 20 }, // Phương thức thanh toán
      { wch: 20 }, // Danh mục
      { wch: 30 }, // Mô tả
      { wch: 25 }, // Người tạo
      { wch: 15 }, // Mã nhân viên
      { wch: 25 }, // Khách hàng
      { wch: 15 }, // Mã khách hàng
      { wch: 20 }, // Hồ sơ vụ việc
      { wch: 15 }, // Ngày giao dịch
      { wch: 20 }, // Thời gian tạo
      { wch: 20 }, // Cập nhật lần cuối
    ];
    worksheet['!cols'] = colWidths;

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
        `Đã xảy ra lỗi khi xuất dữ liệu giao dịch: ${error.message}`
      );
    }
    throw error;
  }
};

// Get transaction statistics
const getTransactionStatistics = async (query: ITransactionQuery = {}) => {
  try {
    const {
      startDate,
      endDate,
      customerId,
      caseServiceId,
      createdById,
      type,
      category,
      paymentMethod,
    } = query;

    // Build filter query (excluding pagination)
    const filter: any = {};

    // Filter by type (but not for statistics aggregation)
    if (type && type !== 'debt') {
      filter.tx_type = type === 'all' ? { $in: ['income', 'outcome'] } : type;
    }

    // Filter by payment method
    if (paymentMethod) {
      filter.tx_paymentMethod = paymentMethod;
    }

    // Filter by category
    if (category) {
      filter.tx_category = category;
    }

    // Filter by customer
    if (customerId) {
      filter.tx_customer = new Types.ObjectId(customerId);
    }

    // Filter by case service
    if (caseServiceId) {
      filter.tx_caseService = new Types.ObjectId(caseServiceId);
    }

    // Filter by creator
    if (createdById) {
      filter.tx_createdBy = new Types.ObjectId(createdById);
    }

    // Filter by date range
    if (startDate || endDate) {
      filter.tx_date = {};
      if (startDate) {
        filter.tx_date.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.tx_date.$lte = new Date(endDate);
      }
    }

    // Main statistics aggregation pipeline
    const mainStatsPipeline: any[] = [
      { $match: filter },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ['$tx_type', 'income'] }, '$tx_amount', 0],
            },
          },
          totalOutcome: {
            $sum: {
              $cond: [{ $eq: ['$tx_type', 'outcome'] }, '$tx_amount', 0],
            },
          },
          totalAmount: { $sum: '$tx_amount' },
          totalPaid: { $sum: '$tx_paid' },
          totalUnpaid: {
            $sum: { $subtract: ['$tx_amount', '$tx_paid'] },
          },
          transactionCount: { $sum: 1 },
          debtCount: {
            $sum: {
              $cond: [
                { $gt: [{ $subtract: ['$tx_amount', '$tx_paid'] }, 0] },
                1,
                0,
              ],
            },
          },
        },
      },
    ];

    // Category breakdown pipeline
    const categoryPipeline: any[] = [
      { $match: filter },
      {
        $group: {
          _id: '$tx_category',
          income: {
            $sum: {
              $cond: [{ $eq: ['$tx_type', 'income'] }, '$tx_amount', 0],
            },
          },
          outcome: {
            $sum: {
              $cond: [{ $eq: ['$tx_type', 'outcome'] }, '$tx_amount', 0],
            },
          },
          total: { $sum: '$tx_amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ];

    // Daily breakdown pipeline (last 30 days if no date filter)
    const dailyFilter = { ...filter };
    if (!startDate && !endDate) {
      // Default to last 30 days if no date range specified
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dailyFilter.tx_date = { $gte: thirtyDaysAgo };
    }

    const dailyPipeline: any[] = [
      { $match: dailyFilter },
      {
        $group: {
          _id: {
            year: { $year: '$tx_date' },
            month: { $month: '$tx_date' },
            day: { $dayOfMonth: '$tx_date' },
          },
          income: {
            $sum: {
              $cond: [{ $eq: ['$tx_type', 'income'] }, '$tx_amount', 0],
            },
          },
          outcome: {
            $sum: {
              $cond: [{ $eq: ['$tx_type', 'outcome'] }, '$tx_amount', 0],
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ];

    // Execute all aggregations in parallel
    const [mainStats, categoryStats, dailyStats] = await Promise.all([
      TransactionModel.aggregate(mainStatsPipeline),
      TransactionModel.aggregate(categoryPipeline),
      TransactionModel.aggregate(dailyPipeline),
    ]);

    const stats = mainStats[0] || {
      totalIncome: 0,
      totalOutcome: 0,
      totalAmount: 0,
      totalPaid: 0,
      totalUnpaid: 0,
      transactionCount: 0,
      debtCount: 0,
    };

    // Format category data for charts
    const byCategory = categoryStats.map((item) => ({
      category: item._id || 'Không phân loại',
      income: item.income,
      outcome: item.outcome,
      total: item.total,
      count: item.count,
    }));
    // Format daily data for charts
    const byDay = dailyStats.map((item) => ({
      date: `${item._id.year}-${String(item._id.month).padStart(
        2,
        '0'
      )}-${String(item._id.day).padStart(2, '0')}`,
      year: item._id.year,
      month: item._id.month,
      day: item._id.day,
      income: item.income,
      outcome: item.outcome,
      net: item.income - item.outcome,
      count: item.count,
    }));

    // Calculate additional metrics for charts
    const averageTransactionAmount =
      stats.transactionCount > 0
        ? (stats.totalIncome + stats.totalOutcome) / stats.transactionCount
        : 0;

    const paymentRatio =
      stats.totalPaid + stats.totalOutcome > 0
        ? (stats.totalPaid / (stats.totalPaid + stats.totalUnpaid)) * 100
        : 0;

    return {
      // Main statistics
      totalIncome: stats.totalIncome,
      totalOutcome: stats.totalOutcome,
      totalPaid: stats.totalPaid,
      totalUnpaid: stats.totalUnpaid,
      transactionCount: stats.transactionCount,
      debtCount: stats.debtCount,
      netAmount: stats.totalIncome - stats.totalOutcome,
      averageTransactionAmount,
      paymentRatio,

      // Chart-friendly breakdowns
      byCategory,
      byDay,
    };
  } catch (error) {
    throw new BadRequestError(
      `Error fetching transaction statistics: ${error}`
    );
  }
};

export {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  bulkDeleteTransactions,
  exportTransactionsToXLSX,
  getTransactionStatistics,
};
