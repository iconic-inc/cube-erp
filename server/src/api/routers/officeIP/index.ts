import { Router } from 'express';

import { OfficeIPController } from '../../controllers/officeIP.controller';

const router = Router();

router.get('/', OfficeIPController.getAllOfficeIPs);
router.get('/:id', OfficeIPController.getOfficeIPById);
router.post('/', OfficeIPController.createOfficeIP);
router.put('/:id', OfficeIPController.updateOfficeIP);
router.delete('/:id', OfficeIPController.deleteOfficeIP);

module.exports = router;
