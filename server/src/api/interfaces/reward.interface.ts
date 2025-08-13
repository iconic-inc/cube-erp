import { HydratedDocument, Model, Types } from 'mongoose';
import { REWARD } from '../constants/reward.constant';

export interface IRewardPopulate {
  id: string;
  rw_name: string;
  rw_currentAmount: number;
  rw_status: Values<typeof REWARD.STATUS>;
  rw_startDate: string | Date;
  rw_endDate?: string | Date;
  rw_eventType: Values<typeof REWARD.EVENT_TYPE>;
  rw_cashedOutAt?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Reward  Interfaces
export interface IReward extends IRewardPopulate {
  rw_description?: string;
}

export interface IRewardCreate {
  name: string;
  description?: string;
  currentAmount?: number;
  eventType: Values<typeof REWARD.EVENT_TYPE>;
  startDate: Date;
  endDate?: Date;
}

export interface IRewardUpdate extends Partial<IRewardCreate> {
  status?: Values<typeof REWARD.STATUS>;
  cashedOutAt?: Date | string;
}

export type IRewardDocument = HydratedDocument<IReward>;

export interface IRewardModel extends Model<IRewardDocument> {
  build(attrs: IRewardCreate): Promise<IRewardDocument>;
}

// Request Interfaces for API
export interface IDeductToRewardRequest {
  rewardId: string;
  amount: number | string;
  description?: string;
}

// Response Interfaces
export interface IRewardStats {
  total: number;
  actives: number;
  totalAvailableAmount: number;
  totalCashedOutAmount: number;
  recentCashouts: IRewardPopulate[];
}

export interface IEmployeeRewardStats {
  actives: number;
  totalAvailableAmount: number;
}
