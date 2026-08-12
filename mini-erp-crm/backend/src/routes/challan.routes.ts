import { Router } from 'express';
import * as challanController from '../controllers/challan.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createChallanSchema,
  listChallansQuerySchema,
  updateChallanSchema,
} from '../validators/challan.validator';

const router = Router();

router.use(authenticate);

// All authenticated roles can view challans.
router.get('/', validate(listChallansQuerySchema, 'query'), challanController.list);
router.get('/:id', challanController.getById);

// Sales creates and edits draft challans.
router.post('/', authorize('ADMIN', 'SALES'), validate(createChallanSchema), challanController.create);
router.put('/:id', authorize('ADMIN', 'SALES'), validate(updateChallanSchema), challanController.update);

// Warehouse (who physically ships the goods) confirms challans; Admin can too.
router.post('/:id/confirm', authorize('ADMIN', 'WAREHOUSE'), challanController.confirm);

// Sales, Warehouse or Admin can cancel.
router.post('/:id/cancel', authorize('ADMIN', 'SALES', 'WAREHOUSE'), challanController.cancel);

export default router;
