import { Router } from 'express';
import { ResourceController } from '../../controllers/resource.controller';
import { authenticationV2 } from '@middlewares/authentication';
import { hasPermission } from '@middlewares/authorization';

const resourceRouter = Router();

// Require authentication for all resource routes
resourceRouter.use(authenticationV2);

// CRUD routes
resourceRouter.get(
  '/',
  hasPermission('resource', 'readAny'),
  ResourceController.getResources
);
resourceRouter.post(
  '/',
  hasPermission('resource', 'createAny'),
  ResourceController.createResource
);
resourceRouter.get(
  '/:resourceId',
  hasPermission('resource', 'readAny'),
  ResourceController.getResourceById
);
resourceRouter.put(
  '/:resourceId',
  hasPermission('resource', 'updateAny'),
  ResourceController.updateResource
);
resourceRouter.delete(
  '/:resourceId',
  hasPermission('resource', 'deleteAny'),
  ResourceController.deleteResource
);

module.exports = resourceRouter;
