import { Request, Response, NextFunction } from 'express';
import { MonitoringService } from '../services/monitoring.service.js';

export class MonitoringController {
  static async getMonitoringIntersections(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await MonitoringService.getMonitoringIntersections(req.user!.role, req.user!.userId);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getIntersectionMonitoringById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await MonitoringService.getIntersectionMonitoringById(req.params.id);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getControllers(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await MonitoringService.getControllers();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await MonitoringService.getDashboardStats(req.user!.role, req.user!.userId);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
