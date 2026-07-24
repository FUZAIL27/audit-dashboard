import { Request, Response } from 'express';
import { auditLogService } from '../services/auditLog.service';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess, buildPaginationMeta } from '../utils/apiResponse';
import { AuditLogListQuery } from '../interfaces/auditLog.interface';
import { Severity, LogStatus } from "../constants/enums";
import { ValidationError } from '../utils/AppError';

export const uploadLogs = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ValidationError('No file was uploaded. Attach a file under the "file" field.');
  }

  const summary = await auditLogService.importFile(
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype
  );

  sendSuccess(res, 201, summary);
});

export const listLogs = catchAsync(async (req: Request, res: Response) => {
  const q = req.query;

  const query: AuditLogListQuery = {
    page: Number(q.page) || 1,
    limit: Number(q.limit) || 25,
    sortBy: (q.sortBy as string) || 'timestamp',
    sortOrder: (q.sortOrder as 'asc' | 'desc') || 'desc',
    search: q.search as string | undefined,
    severity: q.severity as Severity[] | undefined,
    status: q.status as LogStatus[] | undefined,
    role: q.role as unknown as string[] | undefined,
    region: q.region as unknown as string[] | undefined,
    actor: q.actor as string | undefined,
    action: q.action as string | undefined,
    resourceType: q.resourceType as unknown as string[] | undefined,
    dateFrom: q.dateFrom as unknown as Date | undefined,
    dateTo: q.dateTo as unknown as Date | undefined,
  };

  const { logs, totalCount } = await auditLogService.list(query);
  const meta = buildPaginationMeta(query.page, query.limit, totalCount);

  sendSuccess(res, 200, logs, meta as unknown as Record<string, unknown>);
});

export const getLogById = catchAsync(async (req: Request, res: Response) => {
  const { log, relatedLogs } = await auditLogService.getById(req.params.id);
  sendSuccess(res, 200, { ...log, relatedLogs });
});

export const updateLogStatus = catchAsync(async (req: Request, res: Response) => {
  const updated = await auditLogService.updateStatus(req.params.id, req.body.status);
  sendSuccess(res, 200, updated);
});

export const deleteLog = catchAsync(async (req: Request, res: Response) => {
  await auditLogService.delete(req.params.id);
  sendSuccess(res, 200, { deletedId: req.params.id });
});
