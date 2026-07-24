import { Router } from 'express';
import authRoutes from './auth.routes';
import logsRoutes from './logs.routes';
import dashboardRoutes from './dashboard.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

router.use('/auth', authRoutes);
router.use('/logs', logsRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
