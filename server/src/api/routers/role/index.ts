import { Router } from 'express';
import { RoleController } from '../../controllers/role.controller';
import { authenticationV2 } from '@middlewares/authentication';
import { hasPermission } from '@middlewares/authorization';

const roleRouter = Router();

// Require authentication for all role routes
roleRouter.use(authenticationV2);

// CRUD routes
roleRouter.get('/', hasPermission('role', 'readAny'), RoleController.getRoles);
roleRouter.post(
  '/',
  hasPermission('role', 'createAny'),
  RoleController.createRole
);
roleRouter.get(
  '/:roleId',
  hasPermission('role', 'readAny'),
  RoleController.getRoleById
);
roleRouter.put(
  '/:roleId',
  hasPermission('role', 'updateAny'),
  RoleController.updateRole
);
roleRouter.delete(
  '/:roleId',
  hasPermission('role', 'deleteAny'),
  RoleController.deleteRole
);

// Grant management
roleRouter.put(
  '/:roleId/grants',
  hasPermission('role', 'updateAny'),
  RoleController.updateRoleGrants
);

roleRouter.post(
  '/:roleId/grants',
  hasPermission('role', 'createAny'),
  RoleController.addRoleGrants
);
roleRouter.delete(
  '/:roleId/grants/:resourceId',
  hasPermission('role', 'deleteAny'),
  RoleController.deleteRoleGrant
);
module.exports = roleRouter;
