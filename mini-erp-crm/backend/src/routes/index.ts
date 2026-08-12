import { Router } from 'express';
import authRoutes from './auth.routes';
import customerRoutes from './customer.routes';
import productRoutes from './product.routes';
import challanRoutes from './challan.routes';

const router = Router();

router.get('/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));

router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/products', productRoutes);
router.use('/challans', challanRoutes);

export default router;
