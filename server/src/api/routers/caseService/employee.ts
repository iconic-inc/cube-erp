import { CaseServiceController } from '@controllers/caseService.controller';
import { Router } from 'express';

const router = Router();

router.get('/', CaseServiceController.getCaseServicesByEmployee);

module.exports = router;
