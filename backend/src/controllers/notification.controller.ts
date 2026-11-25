import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service.js';

export class NotificationController {
  static async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await NotificationService.getUserNotifications(req.user!.userId);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await NotificationService.markAsRead(req.params.id, req.user!.userId);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await NotificationService.markAllAsRead(req.user!.userId);
      return res.status(200).json({ success: true, message: data.message });
    } catch (error) {
      next(error);
    }
  }
}
