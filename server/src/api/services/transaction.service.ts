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

    // Build match filter
    const match: any = {};
    if (search) {
      match.$or = [
        { tx_code: { $regex: search, $options: 'i' } },
        { tx_title: { $regex: search, $options: 'i' } },
        { tx_description: { $regex: search, $options: 'i' } },
      ];
    }
    if (type) {
      match.tx_type = type;
    }
    if (paymentMethod) {
      match.tx_paymentMethod = paymentMethod;
    }
    if (category) {
      match.tx_category = category;
    }
    if (customerId) {
      match.tx_customer = new Types.ObjectId(customerId);
    }
    if (caseServiceId) {
      match.tx_caseService = new Types.ObjectId(caseServiceId);
    }
    if (createdById) {
      match.tx_createdBy = new Types.ObjectId(createdById);
    }
    if (amountMin !== undefined || amountMax !== undefined) {
      match.tx_amount = {};
      if (amountMin !== undefined) match.tx_amount.$gte = amountMin;
      if (amountMax !== undefined) match.tx_amount.$lte = amountMax;
    }
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    // // Special handling for debt type
    // const debtExpr =
    //   type === 'debt' ? { $expr: { $gt: ['$tx_amount', '$tx_paid'] } } : null;

    // Sorting
    let sort: any = {};
    if (sortBy && sortBy !== 'tx_remain') {
      //   // Sort by remaining amount (tx_amount - tx_paid)
      //   sort = {
      //     $addFields: { tx_remain: { $subtract: ['$tx_amount', '$tx_paid'] } },
      //   };
      // } else if (sortBy) {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.createdAt = -1;
    }

    // Aggregation pipeline
    const pipeline: any[] = [];
    if (Object.keys(match).length > 0) pipeline.push({ $match: match });
    // if (debtExpr) pipeline.push({ $match: debtExpr });

    // Add tx_remain field if sorting by it
    if (sortBy === 'tx_remain') {
      pipeline.push({
        $addFields: { tx_remain: { $subtract: ['$tx_amount', '$tx_paid'] } },
      });
      pipeline.push({ $sort: { tx_remain: sortOrder === 'asc' ? 1 : -1 } });
    } else {
      pipeline.push({ $sort: sort });
    }
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await TransactionModel.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: +limit });

    // Populate references using $lookup
    pipeline.push(
      // Populate tx_createdBy
      {
        $lookup: {
          from: USER.EMPLOYEE.COLLECTION_NAME,
          localField: 'tx_createdBy',
          foreignField: '_id',
          as: 'tx_createdBy',
        },
      },
      { $unwind: { path: '$tx_createdBy', preserveNullAndEmptyArrays: true } },
      // Populate emp_user inside tx_createdBy
      {
        $lookup: {
          from: USER.COLLECTION_NAME,
          localField: 'tx_createdBy.emp_user',
          foreignField: '_id',
          as: 'tx_createdBy.emp_user',
        },
      },
      {
        $unwind: {
          path: '$tx_createdBy.emp_user',
          preserveNullAndEmptyArrays: true,
        },
      },
      // Populate tx_customer
      {
        $lookup: {
          from: CUSTOMER.COLLECTION_NAME,
          localField: 'tx_customer',
          foreignField: '_id',
          as: 'tx_customer',
        },
      },
      { $unwind: { path: '$tx_customer', preserveNullAndEmptyArrays: true } },
      // Populate tx_caseService
      {
        $lookup: {
          from: CASE_SERVICE.COLLECTION_NAME,
          localField: 'tx_caseService',
          foreignField: '_id',
          as: 'tx_caseService',
        },
      },
      {
        $unwind: { path: '$tx_caseService', preserveNullAndEmptyArrays: true },
      },
      // Populate case_customer inside tx_caseService
      {
        $lookup: {
          from: CUSTOMER.COLLECTION_NAME,
          localField: 'tx_caseService.case_customer',
          foreignField: '_id',
          as: 'tx_caseService.case_customer',
        },
      },
      {
        $unwind: {
          path: '$tx_caseService.case_customer',
          preserveNullAndEmptyArrays: true,
        },
      }
    );

    // Execute aggregation
    const transactions = await TransactionModel.aggregate(pipeline);

    return {
      data: getReturnList(transactions) as unknown as ITransactionResponse[],
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  } catch (error) {
    throw new BadRequestError(`Error fetching transactions: ${error}`);
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
  data: ITransactionCreate
): Promise<ITransactionResponse> => {
  try {
    // Validate that createdBy employee exists
    await getEmployeeByUserId(data.createdBy);

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
    const transaction = await TransactionModel.build(data);
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
    // Get all transactions without pagination for export
    const { data: transactions } = await getTransactions({
      ...query,
      page: 1,
      limit: Number.MAX_SAFE_INTEGER,
    });

    // Transform data for export
    const exportData = transactions.map((transaction: any) => ({
      'Mã giao dịch': transaction.tx_code,
      Loại:
        transaction.tx_type === 'income'
          ? 'Thu'
          : transaction.tx_type === 'outcome'
          ? 'Chi'
          : 'Công nợ',
      'Tiêu đề': transaction.tx_title,
      'Số tiền': transaction.tx_amount,
      'Đã thanh toán': transaction.tx_paid,
      'Còn nợ': transaction.tx_amount - transaction.tx_paid,
      'Phương thức thanh toán': transaction.tx_paymentMethod,
      'Danh mục': transaction.tx_category,
      'Mô tả': transaction.tx_description || '',
      'Người tạo':
        transaction.tx_createdBy?.emp_user?.usr_firstName +
        ' ' +
        transaction.tx_createdBy?.emp_user?.usr_lastName,
      'Khách hàng': transaction.tx_customer
        ? `${transaction.tx_customer.cus_firstName} ${transaction.tx_customer.cus_lastName}`
        : '',
      'Hồ sơ vụ việc': transaction.tx_caseService?.case_code || '',
      'Ngày tạo': new Date(transaction.createdAt).toLocaleDateString('vi-VN'),
    }));

    return {
      data: exportData,
      filename: `giao_dich_${new Date().toISOString().split('T')[0]}.xlsx`,
    };
  } catch (error) {
    throw new BadRequestError(`Error exporting transactions: ${error}`);
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
      filter.tx_type = type;
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
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    // Aggregation pipeline for statistics
    const pipeline: any[] = [
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

    const result = await TransactionModel.aggregate(pipeline);
    const stats = result[0] || {
      totalIncome: 0,
      totalOutcome: 0,
      totalAmount: 0,
      totalPaid: 0,
      totalUnpaid: 0,
      transactionCount: 0,
      debtCount: 0,
    };

    return {
      totalIncome: stats.totalIncome,
      totalOutcome: stats.totalOutcome,
      totalDebt: stats.totalUnpaid,
      totalPaid: stats.totalPaid,
      totalUnpaid: stats.totalUnpaid,
      transactionCount: stats.transactionCount,
      debtCount: stats.debtCount,
      netAmount: stats.totalIncome - stats.totalOutcome,
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
