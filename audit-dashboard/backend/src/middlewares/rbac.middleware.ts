import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../constants/enums';
import { ForbiddenError, UnauthorizedError } from '../utils/AppError';

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError(
        `This action requires one of the following roles: ${allowedRoles.join(', ')}`
      );
    }
    next();
  };
}
