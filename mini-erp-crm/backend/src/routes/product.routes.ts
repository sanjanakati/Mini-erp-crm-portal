import { Router } from 'express';
import * as productController from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createProductSchema,
  listProductsQuerySchema,
  stockMovementSchema,
  updateProductSchema,
} from '../validators/product.validator';

const router = Router();

router.use(authenticate);

// All authenticated roles can view products/stock.
router.get('/', validate(listProductsQuerySchema, 'query'), productController.list);
router.get('/:id', productController.getById);

// Only Admin and Warehouse manage product master data and stock.
router.post(
  '/',
  authorize('ADMIN', 'WAREHOUSE'),
  validate(createProductSchema),
  productController.create
);
router.put(
  '/:id',
  authorize('ADMIN', 'WAREHOUSE'),
  validate(updateProductSchema),
  productController.update
);
router.post(
  '/:id/stock-movements',
  authorize('ADMIN', 'WAREHOUSE'),
  validate(stockMovementSchema),
  productController.addStockMovement
);

export default router;
