import { REWARD } from '~/constants/reward.constant';

export interface IRewardBrief {
  id: string;
  rw_name: string;
  rw_currentAmount: number;
  rw_status: (typeof REWARD.STATUS)[keyof typeof REWARD.STATUS]['value'];
  rw_startDate: string | Date;
  rw_endDate?: string | Date;
  rw_eventType: (typeof REWARD.EVENT_TYPE)[keyof typeof REWARD.EVENT_TYPE]['value'];
  rw_cashedOutAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IReward extends IRewardBrief {
  rw_description?: string;
}

export interface IRewardCreate {
  name: string;
  description?: string;
  currentAmount?: number;
  eventType: (typeof REWARD.EVENT_TYPE)[keyof typeof REWARD.EVENT_TYPE]['value'];
  startDate: string;
  endDate?: string;
}

export interface IRewardUpdate extends Partial<IRewardCreate> {
  status?: (typeof REWARD.STATUS)[keyof typeof REWARD.STATUS]['value'];
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
  recentCashouts: IRewardBrief[];
}

export interface IEmployeeRewardStats {
  actives: number;
  totalAvailableAmount: number;
}
