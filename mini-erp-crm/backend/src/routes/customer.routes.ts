import { Router } from 'express';
import * as customerController from '../controllers/customer.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  addCustomerNoteSchema,
  createCustomerSchema,
  listCustomersQuerySchema,
  updateCustomerSchema,
} from '../validators/customer.validator';

const router = Router();

router.use(authenticate);

// All authenticated roles can view customers (Admin, Sales, Warehouse, Accounts).
router.get('/', validate(listCustomersQuerySchema, 'query'), customerController.list);
router.get('/:id', customerController.getById);

// Only Admin and Sales manage the CRM records.
router.post(
  '/',
  authorize('ADMIN', 'SALES'),
  validate(createCustomerSchema),
  customerController.create
);
router.put(
  '/:id',
  authorize('ADMIN', 'SALES'),
  validate(updateCustomerSchema),
  customerController.update
);
router.post(
  '/:id/notes',
  authorize('ADMIN', 'SALES'),
  validate(addCustomerNoteSchema),
  customerController.addNote
);

export default router;
