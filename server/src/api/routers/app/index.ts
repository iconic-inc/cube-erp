import { Router } from 'express';
import { AppController } from '../../controllers/app.controller';
import { authenticationV2 } from '@middlewares/authentication';
import { hasPermission } from '@middlewares/authorization';
import { diskStorage } from 'src/configs/config.multer';

const router = Router();

router.get('/settings', AppController.getAppSettings);

router.use(authenticationV2);

router.put(
  '/settings',
  hasPermission('app', 'updateAny'),
  diskStorage.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'favicon', maxCount: 1 },
  ]),
  AppController.updateAppSettings
);

module.exports = router;
