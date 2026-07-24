import { query, param, body } from 'express-validator';
import { Severity, LogStatus, SORTABLE_FIELDS, PAGE_SIZE_OPTIONS } from '../constants/enums';

const toArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') return value.split(',').map((v) => v.trim()).filter(Boolean);
  return [];
};

export const listLogsValidator = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit')
    .optional()
    .isIn(PAGE_SIZE_OPTIONS.map(String))
    .withMessage(`limit must be one of ${PAGE_SIZE_OPTIONS.join(', ')}`)
    .toInt(),
  query('sortBy')
    .optional()
    .isIn(SORTABLE_FIELDS as readonly string[])
    .withMessage(`sortBy must be one of ${SORTABLE_FIELDS.join(', ')}`),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('search').optional().isString().trim().isLength({ max: 256 }),
  query('severity')
    .optional()
    .customSanitizer(toArray)
    .custom((arr: string[]) => arr.every((v) => Object.values(Severity).includes(v as Severity)))
    .withMessage(`severity must be one of ${Object.values(Severity).join(', ')}`),
  query('status')
    .optional()
    .customSanitizer(toArray)
    .custom((arr: string[]) => arr.every((v) => Object.values(LogStatus).includes(v as LogStatus)))
    .withMessage(`status must be one of ${Object.values(LogStatus).join(', ')}`),
  query('role').optional().customSanitizer(toArray),
  query('region').optional().customSanitizer(toArray),
  query('resourceType').optional().customSanitizer(toArray),
  query('actor').optional().isString().trim().isLength({ max: 256 }),
  query('action').optional().isString().trim().isLength({ max: 128 }),
  query('dateFrom').optional().isISO8601().toDate(),
  query('dateTo').optional().isISO8601().toDate(),
];

export const logIdValidator = [param('id').isMongoId().withMessage('Invalid log id')];

export const updateStatusValidator = [
  param('id').isMongoId().withMessage('Invalid log id'),
  body('status')
    .isIn(Object.values(LogStatus))
    .withMessage(`status must be one of ${Object.values(LogStatus).join(', ')}`),
];

export const dashboardQueryValidator = [
  query('dateFrom').optional().isISO8601().toDate(),
  query('dateTo').optional().isISO8601().toDate(),
];

export const chartsQueryValidator = [
  ...dashboardQueryValidator,
  query('granularity').optional().isIn(['day', 'hour']),
];
