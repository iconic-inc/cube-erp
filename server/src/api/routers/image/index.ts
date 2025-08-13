import { Router } from 'express';

import { ImageController } from '@controllers/image.controller';
import { authenticationV2 } from '@middlewares/authentication';
import { hasPermission } from '@middlewares/authorization';
import { diskImageStorage } from '@configs/config.multer';

const imageRouter = Router();

imageRouter.get('/', ImageController.getImages);
imageRouter.get('/:id', ImageController.getImage);

imageRouter.use(authenticationV2);

imageRouter.post(
  '/',
  hasPermission('image', 'createAny'),
  diskImageStorage.array('image'),
  ImageController.createImage
);

imageRouter.put(
  '/:id',
  hasPermission('image', 'updateAny'),
  ImageController.updateImage
);

imageRouter.delete(
  '/:id',
  hasPermission('image', 'deleteAny'),
  ImageController.deleteImage
);

module.exports = imageRouter;
