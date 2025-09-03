import { Router } from 'express';
import { TaskController } from '../../controllers/task.controller';
import { authenticationV2 } from '../../middlewares/authentication';
import { hasPermission } from '../../middlewares/authorization';
import { validateObjectId, validateSchema } from '@schemas/index';
import { taskCreateSchema, taskUpdateSchema } from '@schemas/task.schema';

const router = Router();

// Require authentication for all routes
router.use(authenticationV2);

// Admin routes
// Create Task
router.post(
  '/',
  validateSchema(taskCreateSchema),
  hasPermission('task', 'createOwn'),
  TaskController.createTask
);

router.get(
  '/performance',
  hasPermission('task', 'readAny'),
  TaskController.getEmployeesPerformance
);

// Get detailed Task by ID
router.get(
  '/:id',
  validateObjectId('id'),
  hasPermission('task', 'readOwn'),
  TaskController.getTaskById
);

// Get all Tasks
router.get('/', hasPermission('task', 'readAny'), TaskController.getTasks);

// Update Task
router.put(
  '/:id',
  validateObjectId('id'),
  validateSchema(taskUpdateSchema),
  hasPermission('task', 'updateOwn'),
  TaskController.updateTask
);

// Delete multiple Tasks
router.delete(
  '/bulk',
  hasPermission('task', 'deleteOwn'),
  TaskController.bulkDeleteTasks
);

// Delete Task
router.delete(
  '/:id',
  validateObjectId('id'),
  hasPermission('task', 'deleteOwn'),
  TaskController.deleteTask
);

// Patch Task
router.patch(
  '/:id',
  validateObjectId('id'),
  hasPermission('task', 'updateOwn'),
  TaskController.patchTask
);

module.exports = router;
