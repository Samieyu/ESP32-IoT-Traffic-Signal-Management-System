import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware.js';
import { dbStore } from '../repositories/store.js';

export function authorizeIntersectionScope(paramName: string = 'intersectionId') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
    }

    // Administrators have global access to all intersections
    if (req.user.role === 'ADMIN') {
      return next();
    }

    // For Traffic Police, extract target intersection ID
    const targetIntersectionId =
      req.params[paramName] ||
      req.params.id ||
      req.body[paramName] ||
      req.body.intersectionId ||
      req.query[paramName] ||
      req.query.intersectionId;

    if (!targetIntersectionId) {
      return next();
    }

    // Check assignments for this officer
    const isAssigned = dbStore.assignments.some(
      (a) =>
        a.userId === req.user!.userId &&
        a.intersectionId === String(targetIntersectionId) &&
        a.status === 'ACTIVE'
    );

    if (!isAssigned) {
      return next(
        new AppError(
          'Access forbidden. You are not assigned to manage or monitor this intersection.',
          403,
          'INTERSECTION_ACCESS_DENIED'
        )
      );
    }

    next();
  };
}
