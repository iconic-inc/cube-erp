import { ISessionUser } from '~/interfaces/auth.interface';
import { fetcher } from '.';
import { IListResponse } from '~/interfaces/response.interface';
import {
  IReward,
  IRewardCreate,
  IRewardUpdate,
  IDeductToRewardRequest,
  IRewardStats,
  IEmployeeRewardStats,
} from '~/interfaces/reward.interface';

/**
 * Get list of rewards with pagination and query
 */
const getRewards = async (
  searchParams: URLSearchParams,
  request: ISessionUser,
) => {
  const response = await fetcher<IListResponse<IReward>>(
    `/rewards?${searchParams.toString()}`,
    { request },
  );
  return response;
};

/**
 * Get a reward by ID
 */
const getRewardById = async (id: string, request: ISessionUser) => {
  const response = await fetcher<any>(`/rewards/${id}`, {
    request,
  });
  return response as IReward;
};

/**
 * Create a new reward
 */
const createReward = async (
  rewardData: IRewardCreate,
  request: ISessionUser,
) => {
  try {
    const response = await fetcher<IReward>('/rewards', {
      method: 'POST',
      body: JSON.stringify(rewardData),
      request,
    });

    return response;
  } catch (error: any) {
    console.error('Error creating reward:', error);
    throw error;
  }
};

/**
 * Update a reward
 */
const updateReward = async (
  id: string,
  data: IRewardUpdate,
  request: ISessionUser,
) => {
  try {
    const response = await fetcher<IReward>(`/rewards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      request,
    });
    return response;
  } catch (error) {
    console.error('Error updating reward:', error);
    throw error;
  }
};

/**
 * Delete a reward
 */
const deleteReward = async (id: string, request: ISessionUser) => {
  try {
    const response = await fetcher<any>(`/rewards/${id}`, {
      method: 'DELETE',
      request,
    });
    return response;
  } catch (error) {
    console.error('Error deleting reward:', error);
    throw error;
  }
};

/**
 * Deduct amount to a reward fund
 */
const deductToReward = async (
  data: IDeductToRewardRequest,
  request: ISessionUser,
) => {
  try {
    const response = await fetcher<IReward>('/rewards/deduct', {
      method: 'POST',
      body: JSON.stringify(data),
      request,
    });
    return response;
  } catch (error) {
    console.error('Error deducting to reward:', error);
    throw error;
  }
};

/**
 * Get reward statistics for admin
 */
const getRewardStats = async (request: ISessionUser) => {
  try {
    const response = await fetcher<IRewardStats>('/rewards/stats', {
      method: 'GET',
      request,
    });
    return response;
  } catch (error) {
    console.error('Error getting reward statistics:', error);
    throw error;
  }
};

/**
 * Get reward statistics for employees
 */
const getRewardStatsForEmployee = async (request: ISessionUser) => {
  try {
    const response = await fetcher<IEmployeeRewardStats>(
      '/employees/me/rewards/stats',
      {
        method: 'GET',
        request,
      },
    );
    return response;
  } catch (error) {
    console.error('Error getting employee reward statistics:', error);
    throw error;
  }
};

/**
 * List rewards for employee view (read-only)
 */
const listRewardsForEmployee = async (
  searchParams: URLSearchParams,
  request: ISessionUser,
) => {
  try {
    const response = await fetcher<IListResponse<IReward>>(
      `/employees/me/rewards?${searchParams.toString()}`,
      {
        method: 'GET',
        request,
      },
    );
    return response;
  } catch (error) {
    console.error('Error listing rewards for employee:', error);
    throw error;
  }
};

export {
  getRewards,
  getRewardById,
  createReward,
  updateReward,
  deleteReward,
  deductToReward,
  getRewardStats,
  getRewardStatsForEmployee,
  listRewardsForEmployee,
};
