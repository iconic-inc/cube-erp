import express from 'express';

import { checkApiKey, checkPermission } from '../auth/checkApiKey';
import { logRequest } from '../middlewares/logger.middleware';
import CheckController from '@controllers/check.controller';
import { AuthController } from '@controllers/auth.controller';

const router = express.Router();

router.use(logRequest);
//check api key

router.get('/check-status', CheckController.checkStatus);

router.get('/auth/verify-email', AuthController.verifyEmailToken);

router.use(checkApiKey);
//check api key's permission
router.use(checkPermission('0000'));

router.use('/images', require('./image'));
router.use('/users', require('./user'));
router.use('/auth', require('./auth'));
router.use('/roles', require('./role'));
router.use('/resources', require('./resource'));

router.use('/tasks', require('./task'));
router.use('/customers', require('./customer'));
router.use('/resources', require('./resource'));
router.use('/employees', require('./employee'));
router.use('/office-ips', require('./officeIP'));
router.use('/attendance', require('./attendance'));
router.use('/attendance-requests', require('./attendanceRequest'));
router.use('/notifications', require('./notification'));
router.use('/case-services', require('./caseService'));
router.use('/documents', require('./document'));
router.use('/transactions', require('./transaction'));
router.use('/rewards', require('./reward'));

module.exports = router;
