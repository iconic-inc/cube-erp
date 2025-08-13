import { Router } from 'express';
import { RewardController } from '@controllers/reward.controller';
import { hasPermission } from '@middlewares/authorization';

const router = Router();

// Employee can view current reward pool stats (read-only)
router.get(
  '/stats',
  hasPermission('reward', 'readAny'),
  RewardController.getRewardStatsForEmployee
);

router.get(
  '/',
  hasPermission('reward', 'readAny'),
  RewardController.listRewardsForEmployee
);

module.exports = router;
