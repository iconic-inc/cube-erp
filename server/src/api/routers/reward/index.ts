import { Router } from 'express';
import { RewardController } from '@controllers/reward.controller';
import { authenticationV2 } from '@middlewares/authentication';
import { hasPermission } from '@middlewares/authorization';
import {
  validateSchema,
  validateQuery,
  validateObjectId,
} from '@schemas/index';
import {
  createRewardSchema,
  updateRewardSchema,
  deductToRewardSchema,
  rewardQuerySchema,
} from '@schemas/reward.schema';

const router = Router();

// Reward  Management Routes (Admin only)
router.post(
  '/',
  authenticationV2,
  hasPermission('reward', 'createAny'),
  validateSchema(createRewardSchema),
  RewardController.createReward
);

router.get(
  '/:id',
  authenticationV2,
  hasPermission('reward', 'readAny'),
  validateObjectId('id'),
  RewardController.getRewardById
);

router.get(
  '/',
  authenticationV2,
  hasPermission('reward', 'readAny'),
  validateQuery(rewardQuerySchema),
  RewardController.getRewards
);

router.put(
  '/:id',
  authenticationV2,
  hasPermission('reward', 'updateAny'),
  validateObjectId('id'),
  validateSchema(updateRewardSchema),
  RewardController.updateReward
);

router.delete(
  '/:id',
  authenticationV2,
  hasPermission('reward', 'deleteAny'),
  validateObjectId('id'),
  RewardController.deleteReward
);

// Financial Operations (Admin only)
router.post(
  '/deduct',
  authenticationV2,
  hasPermission('reward', 'createAny'),
  validateSchema(deductToRewardSchema),
  RewardController.deductToReward
);

// Statistics Routes
router.get(
  '/stats',
  authenticationV2,
  hasPermission('reward', 'readAny'),
  RewardController.getRewardStats
);

module.exports = router;
