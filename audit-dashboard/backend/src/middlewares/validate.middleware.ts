import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ValidationError } from '../utils/AppError';

export function validate(req: Request, _res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((err) => ({
      field: 'path' in err ? err.path : undefined,
      message: err.msg,
    }));
    throw new ValidationError('Request validation failed', details);
  }
  next();
}
