import { Router } from 'express';
import * as auditLogController from '../controllers/auditLog.controller';
import {
  listLogsValidator,
  logIdValidator,
  updateStatusValidator,
} from '../validators/auditLog.validator';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { uploadMiddleware } from '../middlewares/upload.middleware';
import { uploadRateLimiter } from '../middlewares/rateLimiter.middleware';
import { UserRole } from '../constants/enums';

const router = Router();

router.use(authenticate);

router.post(
  '/upload',
  requireRole(UserRole.ADMIN),
  uploadRateLimiter,
  uploadMiddleware,
  auditLogController.uploadLogs
);

router.get('/', listLogsValidator, validate, auditLogController.listLogs);

router.get('/:id', logIdValidator, validate, auditLogController.getLogById);

router.patch(
  '/:id/status',
  requireRole(UserRole.ADMIN),
  updateStatusValidator,
  validate,
  auditLogController.updateLogStatus
);

router.delete(
  '/:id',
  requireRole(UserRole.ADMIN),
  logIdValidator,
  validate,
  auditLogController.deleteLog
);

export default router;
