import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.utils.js';
import { AppError } from './error.middleware.js';
import { dbStore } from '../repositories/store.js';
import { env } from '../config/env.js';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next(new AppError('Authentication required. No token provided.', 401, 'UNAUTHORIZED'));
  }

  try {
    const payload = verifyAccessToken(token);

    // Verify user exists and check account status
    const user = dbStore.users.find((u) => u.id === payload.userId);
    if (!user) {
      return next(new AppError('User account associated with token no longer exists.', 401, 'USER_NOT_FOUND'));
    }

    if (user.status === 'INACTIVE' && !env.ALLOW_INACTIVE_LOGIN) {
      return next(new AppError('Your account has been deactivated. Access denied.', 403, 'ACCOUNT_INACTIVE'));
    }

    req.user = payload;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Access token expired. Please refresh your session.', 401, 'TOKEN_EXPIRED'));
    }
    return next(new AppError('Invalid authentication token.', 401, 'INVALID_TOKEN'));
  }
}
