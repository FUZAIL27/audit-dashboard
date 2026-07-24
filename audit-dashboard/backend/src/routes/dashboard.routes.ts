import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { dashboardQueryValidator, chartsQueryValidator } from '../validators/auditLog.validator';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/stats', dashboardQueryValidator, validate, dashboardController.getStats);
router.get('/charts', chartsQueryValidator, validate, dashboardController.getCharts);
router.get('/activity', dashboardController.getActivity);

export default router;
