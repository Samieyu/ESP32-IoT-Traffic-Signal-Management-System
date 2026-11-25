import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { uuidv4 } from '../utils/id.utils.js';
import { dbStore, UserEntity } from '../repositories/store.js';
import { LoginInput } from '../validators/auth.validator.js';
import { AppError } from '../middleware/error.middleware.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.utils.js';
import { env } from '../config/env.js';

export class AuthService {
  static async login(input: LoginInput, ipAddress?: string, userAgent?: string) {
    await dbStore.initSeed();

    const normalizedQuery = input.usernameOrEmail.trim().toLowerCase();
    const user = dbStore.users.find(
      (u) => u.email.toLowerCase() === normalizedQuery || u.username.toLowerCase() === normalizedQuery
    );

    if (!user) {
      throw new AppError('Invalid email/username or password.', 401, 'INVALID_CREDENTIALS');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Invalid email/username or password.', 401, 'INVALID_CREDENTIALS');
    }

    // Account status verification (Addressing the UC-01 / FR-2 specification)
    if (user.status === 'INACTIVE' && !env.ALLOW_INACTIVE_LOGIN) {
      throw new AppError(
        'Your account has been deactivated. Please contact the system administrator to reactivate your access.',
        403,
        'ACCOUNT_INACTIVE'
      );
    }

    // Token generation
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    // Refresh Session storage
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    dbStore.refreshSessions.push({
      id: uuidv4(),
      userId: user.id,
      tokenHash,
      deviceInfo: userAgent || null,
      ipAddress: ipAddress || null,
      expiresAt,
      isRevoked: false,
      createdAt: new Date(),
    });

    user.lastLoginAt = new Date();

    // Audit log
    dbStore.auditLogs.unshift({
      id: uuidv4(),
      userId: user.id,
      userRole: user.role,
      action: 'USER_LOGIN_SUCCESS',
      entityType: 'User',
      entityId: user.id,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      createdAt: new Date(),
    });

    // Retrieve active assignments
    const assignments = dbStore.assignments
      .filter((a) => a.userId === user.id && a.status === 'ACTIVE')
      .map((a) => {
        const intersection = dbStore.intersections.find((i) => i.id === a.intersectionId);
        return {
          id: a.id,
          intersectionId: a.intersectionId,
          assignedAt: a.assignedAt,
          intersectionName: intersection ? intersection.name : 'Unknown Intersection',
          intersectionCode: intersection ? intersection.code : 'UNKNOWN',
        };
      });

    const { passwordHash: _, ...sanitizedUser } = user;

    return {
      user: {
        ...sanitizedUser,
        assignments,
      },
      accessToken,
      refreshToken,
    };
  }

  static async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new AppError('Refresh token is required.', 400, 'REFRESH_TOKEN_REQUIRED');
    }

    let payload: any;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError('Invalid or expired refresh token.', 401, 'INVALID_REFRESH_TOKEN');
    }

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const session = dbStore.refreshSessions.find(
      (s) => s.tokenHash === tokenHash && !s.isRevoked && s.expiresAt > new Date()
    );

    if (!session) {
      throw new AppError('Refresh token session revoked or expired.', 401, 'SESSION_EXPIRED');
    }

    const user = dbStore.users.find((u) => u.id === payload.userId);
    if (!user || (user.status === 'INACTIVE' && !env.ALLOW_INACTIVE_LOGIN)) {
      session.isRevoked = true;
      throw new AppError('Account deactivated or deleted.', 403, 'ACCOUNT_INACTIVE');
    }

    // Revoke old session and rotate
    session.isRevoked = true;

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const newAccessToken = signAccessToken(tokenPayload);
    const newRefreshToken = signRefreshToken(tokenPayload);

    const newTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    dbStore.refreshSessions.push({
      id: uuidv4(),
      userId: user.id,
      tokenHash: newTokenHash,
      deviceInfo: session.deviceInfo,
      ipAddress: session.ipAddress,
      expiresAt: newExpiresAt,
      isRevoked: false,
      createdAt: new Date(),
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  static async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const session = dbStore.refreshSessions.find((s) => s.tokenHash === tokenHash);
      if (session) {
        session.isRevoked = true;
      }
    }

    dbStore.auditLogs.unshift({
      id: uuidv4(),
      userId,
      userRole: 'USER',
      action: 'USER_LOGOUT',
      entityType: 'User',
      entityId: userId,
      createdAt: new Date(),
    });

    return { message: 'Logged out successfully.' };
  }

  static async getCurrentUser(userId: string) {
    const user = dbStore.users.find((u) => u.id === userId);
    if (!user) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    const assignments = dbStore.assignments
      .filter((a) => a.userId === user.id && a.status === 'ACTIVE')
      .map((a) => {
        const intersection = dbStore.intersections.find((i) => i.id === a.intersectionId);
        return {
          id: a.id,
          intersectionId: a.intersectionId,
          assignedAt: a.assignedAt,
          intersectionName: intersection ? intersection.name : 'Unknown Intersection',
          intersectionCode: intersection ? intersection.code : 'UNKNOWN',
        };
      });

    const { passwordHash: _, ...sanitizedUser } = user;
    return {
      ...sanitizedUser,
      assignments,
    };
  }
}
