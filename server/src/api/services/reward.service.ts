import mongoose, { isValidObjectId } from 'mongoose';
import { TransactionModel } from '../models/transaction.model';
import { EmployeeModel } from '../models/employee.model';
import { getEmployeeByUserId } from './employee.service';
import { BadRequestError, NotFoundError } from '../core/errors';
import {
  formatAttributeName,
  getReturnData,
  getReturnList,
  removeNestedNullish,
  toCurrencyString,
} from '@utils/index';
import { REWARD, TRANSACTION } from '../constants';
import {
  IDeductToRewardRequest,
  IEmployeeRewardStats,
  IReward,
  IRewardCreate,
  IRewardPopulate,
  IRewardStats,
  IRewardUpdate,
} from '../interfaces/reward.interface';
import { RewardModel } from '@models/reward.model';

// Reward  Management
const createReward = async (data: IRewardCreate, userId: string) => {
  try {
    const reward = await RewardModel.build(
      removeNestedNullish({ ...data, currentAmount: 0 })
    );

    if (data.currentAmount && data.currentAmount > 0) {
      await deductToReward(
        { rewardId: reward.id, amount: data.currentAmount },
        userId
      );
    }

    return await getRewardById(reward.id);
  } catch (error) {
    throw new BadRequestError(`Error creating reward : ${error}`);
  }
};

const getRewards = async (query: any = {}) => {
  const { page = 1, limit = 10, status, eventType, search } = query;

  const pipeline: any[] = [];

  // Match stage
  const matchStage: any = {};
  if (status) matchStage.rw_status = status;
  if (eventType) matchStage.rw_eventType = eventType;
  if (search) {
    matchStage.$or = [
      { rw_name: { $regex: search, $options: 'i' } },
      { rw_description: { $regex: search, $options: 'i' } },
    ];
  }

  if (Object.keys(matchStage).length > 0) {
    pipeline.push({ $match: matchStage });
  }

  // Sort
  pipeline.push({ $sort: { rw_status: 1 } });

  // Get total count
  const countPipeline = [...pipeline];
  countPipeline.push({ $count: 'total' });
  const countResult = await RewardModel.aggregate(countPipeline);
  const total = countResult.length > 0 ? countResult[0].total : 0;

  // Pagination
  pipeline.push({ $skip: (page - 1) * limit });
  pipeline.push({ $limit: +limit });

  const rewards = await RewardModel.aggregate(pipeline);
  const totalPages = Math.ceil(total / limit);

  return {
    data: getReturnList(rewards),
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  };
};

const getRewardById = async (id: string) => {
  if (!isValidObjectId(id)) {
    throw new BadRequestError('Invalid reward  ID');
  }

  const result = await RewardModel.findById(id);

  if (!result) {
    throw new NotFoundError('Reward  not found');
  }

  return getReturnData(result);
};

const updateReward = async (id: string, data: IRewardUpdate) => {
  if (!isValidObjectId(id)) {
    throw new BadRequestError('Invalid reward  ID');
  }

  if (data.status && data.status !== REWARD.STATUS.ACTIVE) {
    data.cashedOutAt = new Date().toISOString();
  }

  const reward = await RewardModel.findByIdAndUpdate(
    id,
    { $set: formatAttributeName(removeNestedNullish(data), REWARD.PREFIX) },
    { new: true }
  );

  if (!reward) {
    throw new NotFoundError('Reward  not found');
  }

  return await getRewardById(id);
};

const deleteReward = async (id: string) => {
  if (!isValidObjectId(id)) {
    throw new BadRequestError('Invalid reward  ID');
  }

  const reward = await RewardModel.findByIdAndDelete(id);

  if (!reward) {
    throw new NotFoundError('Reward  not found');
  }

  return { success: true, message: 'Reward  deleted successfully' };
};

// Financial Operations
const deductToReward = async (data: IDeductToRewardRequest, userId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const employee = await getEmployeeByUserId(userId);

    // Validate reward
    const reward = await RewardModel.findById(data.rewardId).session(session);
    if (!reward) {
      throw new NotFoundError('Reward  not found');
    }

    if (reward.rw_status !== REWARD.STATUS.ACTIVE) {
      throw new BadRequestError(
        'Bạn chỉ có thể khấu trừ vào quỹ thưởng đang hoạt động'
      );
    }

    // Create transaction record for the deduction
    const transactionCode = `TX_RW_${Date.now()}`;
    await TransactionModel.create(
      [
        {
          tx_code: transactionCode,
          tx_type: TRANSACTION.TYPE.OUTCOME,
          tx_title: `Khấu trừ vào Quỹ thưởng: ${reward.rw_name}`,
          tx_amount: data.amount,
          tx_paid: data.amount,
          tx_paymentMethod: TRANSACTION.PAYMENT_METHOD.OTHER,
          tx_category: TRANSACTION.CATEGORY.OUTCOME.REWARD,
          tx_description:
            data.description ||
            `Khấu trừ ${toCurrencyString(data.amount)} vào quỹ thưởng: ${
              reward.rw_name
            }`,
          tx_date: new Date().toISOString(),
          tx_createdBy: employee.id,
        },
      ],
      { session }
    );

    // Update reward  amount
    await RewardModel.findByIdAndUpdate(
      data.rewardId,
      {
        $inc: {
          rw_currentAmount: data.amount,
        },
      },
      { session }
    );

    await session.commitTransaction();

    return await getRewardById(data.rewardId);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Statistics
const getRewardStats = async (): Promise<IRewardStats> => {
  try {
    // Get total number of rewards
    const total = await RewardModel.countDocuments();

    // Get active rewards count
    const actives = await RewardModel.countDocuments({
      rw_status: REWARD.STATUS.ACTIVE,
    });

    // Calculate total available amount (sum of current amounts in active rewards)
    const totalAvailableAmountResult = await RewardModel.aggregate([
      { $match: { rw_status: REWARD.STATUS.ACTIVE } },
      { $group: { _id: null, total: { $sum: '$rw_currentAmount' } } },
    ]);
    const totalAvailableAmount =
      totalAvailableAmountResult.length > 0
        ? totalAvailableAmountResult[0].total
        : 0;

    // Calculate total cashed out amount using transactions
    const totalCashedOutAmountResult = await TransactionModel.aggregate([
      {
        $match: {
          tx_category: TRANSACTION.CATEGORY.OUTCOME.REWARD,
          tx_type: TRANSACTION.TYPE.OUTCOME,
        },
      },
      { $group: { _id: null, total: { $sum: '$tx_amount' } } },
    ]);
    const totalCashedOutAmount =
      totalCashedOutAmountResult.length > 0
        ? totalCashedOutAmountResult[0].total
        : 0;

    // Get recent cashed out rewards (limited to 5)
    const recentCashouts = await RewardModel.find({
      rw_cashedOutAt: { $exists: true, $ne: null },
    })
      .sort({ rw_cashedOutAt: -1 })
      .limit(5);

    // Convert to required IRewardPopulate[] format
    const formattedRecentCashouts = recentCashouts.map((cashout) => {
      return {
        id: cashout._id.toString(),
        rw_name: cashout.rw_name,
        rw_currentAmount: cashout.rw_currentAmount,
        rw_status: cashout.rw_status,
        rw_startDate: cashout.rw_startDate,
        rw_endDate: cashout.rw_endDate,
        rw_eventType: cashout.rw_eventType,
        rw_cashedOutAt: cashout.rw_cashedOutAt,
        createdAt: cashout.createdAt,
        updatedAt: cashout.updatedAt,
      } as IRewardPopulate;
    });

    return {
      total,
      actives,
      totalAvailableAmount,
      totalCashedOutAmount,
      recentCashouts: formattedRecentCashouts,
    };
  } catch (error) {
    throw new BadRequestError(`Error getting reward statistics: ${error}`);
  }
};

const getRewardStatsForEmployee = async (): Promise<IEmployeeRewardStats> => {
  try {
    // Get active rewards count
    const actives = await RewardModel.countDocuments({
      rw_status: REWARD.STATUS.ACTIVE,
    });

    // Calculate total available amount from all active rewards
    const totalAvailableAmountResult = await RewardModel.aggregate([
      { $match: { rw_status: REWARD.STATUS.ACTIVE } },
      { $group: { _id: null, total: { $sum: '$rw_currentAmount' } } },
    ]);
    const totalAvailableAmount =
      totalAvailableAmountResult.length > 0
        ? totalAvailableAmountResult[0].total
        : 0;

    return {
      actives,
      totalAvailableAmount,
    };
  } catch (error) {
    throw new BadRequestError(
      `Error getting employee reward statistics: ${error}`
    );
  }
};

export {
  createReward,
  getRewards,
  getRewardById,
  updateReward,
  deleteReward,
  deductToReward,
  getRewardStats,
  getRewardStatsForEmployee,
};
