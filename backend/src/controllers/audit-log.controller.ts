import { Request, Response, NextFunction } from 'express';
import { AuditLogService } from '../services/audit-log.service.js';

export class AuditLogController {
  static async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { action, userId, entityType } = req.query;
      const data = await AuditLogService.getAuditLogs({
        action: action as string,
        userId: userId as string,
        entityType: entityType as string,
      });

      return res.status(200).json({ success: true, data, total: data.length });
    } catch (error) {
      next(error);
    }
  }
}
