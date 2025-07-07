import { TaskController } from '@controllers/task.controller';
import { hasPermission } from '@middlewares/authorization';
import { validateObjectId } from '@schemas/index';
import { Router } from 'express';

const router = Router();

// Employee Task routes

router.get(
  '/performance',
  hasPermission('task', 'readOwn'),
  TaskController.getMyPerformance
);

router.get(
  '/:taskId',
  validateObjectId('taskId'),
  hasPermission('task', 'readOwn'),
  TaskController.getMyTaskById
);

router.get('/', hasPermission('task', 'readOwn'), TaskController.getMyTasks);

module.exports = router;
