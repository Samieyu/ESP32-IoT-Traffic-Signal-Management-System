import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware.js';

export function authorizeRoles(...allowedRoles: Array<'ADMIN' | 'TRAFFIC_POLICE'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access forbidden. Required role(s): ${allowedRoles.join(', ')}. Current role: ${req.user.role}.`,
          403,
          'FORBIDDEN_ROLE'
        )
      );
    }

    next();
  };
}
