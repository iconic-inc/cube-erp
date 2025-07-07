import { Request, Response } from 'express';
import { OK } from '../core/success.response';
import * as rewardService from '../services/reward.service';
import { REWARD } from '@constants/reward.constant';

export class RewardController {
  // Reward  Management
  static async createReward(req: Request, res: Response) {
    return OK({
      res,
      message: 'Reward  created successfully',
      metadata: await rewardService.createReward(req.body, req.user.userId),
    });
  }

  static async getRewards(req: Request, res: Response) {
    return OK({
      res,
      message: 'Reward s fetched successfully',
      metadata: await rewardService.getRewards(req.query),
    });
  }

  static async getRewardById(req: Request, res: Response) {
    return OK({
      res,
      message: 'Reward  fetched successfully',
      metadata: await rewardService.getRewardById(req.params.id),
    });
  }

  static async updateReward(req: Request, res: Response) {
    return OK({
      res,
      message: 'Reward  updated successfully',
      metadata: await rewardService.updateReward(req.params.id, req.body),
    });
  }

  static async deleteReward(req: Request, res: Response) {
    return OK({
      res,
      message: 'Reward  deleted successfully',
      metadata: await rewardService.deleteReward(req.params.id),
    });
  }

  // Financial Operations
  static async deductToReward(req: Request, res: Response) {
    return OK({
      res,
      message: 'Amount deducted to reward  successfully',
      metadata: await rewardService.deductToReward(req.body, req.user.userId),
    });
  }

  // Statistics
  static async getRewardStats(req: Request, res: Response) {
    return OK({
      res,
      message: 'Reward  statistics fetched successfully',
      metadata: await rewardService.getRewardStats(),
    });
  }

  static async getRewardStatsForEmployee(req: Request, res: Response) {
    return OK({
      res,
      message: 'Reward  statistics for employee fetched successfully',
      metadata: await rewardService.getRewardStatsForEmployee(),
    });
  }

  static async listRewardsForEmployee(req: Request, res: Response) {
    return OK({
      res,
      message: 'Employee reward statistics fetched successfully',
      metadata: await rewardService.getRewards({
        ...req.query,
        status: REWARD.STATUS.ACTIVE,
      }),
    });
  }
}
