import { Router } from 'express';
import { TaskController } from '../../controllers/task.controller';
import { authenticationV2 } from '../../middlewares/authentication';
import { hasPermission } from '../../middlewares/authorization';
import { validateObjectId } from '@schemas/index';

const router = Router();

// Require authentication for all routes
router.use(authenticationV2);

// Admin routes
// Create Task
router.post('/', hasPermission('task', 'createAny'), TaskController.createTask);

router.get(
  '/performance',
  hasPermission('task', 'readAny'),
  TaskController.getEmployeesPerformance
);

// Get detailed Task by ID
router.get(
  '/:id',
  validateObjectId('id'),
  hasPermission('task', 'readAny'),
  TaskController.getTaskById
);

// Get all Tasks
router.get('/', hasPermission('task', 'readAny'), TaskController.getTasks);

// Update Task
router.put(
  '/:id',
  validateObjectId('id'),
  hasPermission('task', 'updateAny'),
  TaskController.updateTask
);

// Delete multiple Tasks
router.delete(
  '/bulk',
  hasPermission('task', 'deleteAny'),
  TaskController.bulkDeleteTasks
);

// Delete Task
router.delete(
  '/:id',
  validateObjectId('id'),
  hasPermission('task', 'deleteAny'),
  TaskController.deleteTask
);

module.exports = router;
