import { Request, Response, NextFunction } from 'express';
import { SignalConfigService } from '../services/signal-config.service.js';
import { signalConfigSchema } from '../validators/signal-config.validator.js';

export class SignalConfigController {
  static async getConfiguration(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await SignalConfigService.getConfigurationByIntersection(req.params.id);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async updateConfiguration(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = signalConfigSchema.parse(req.body);
      const result = await SignalConfigService.updateConfiguration(
        req.params.id,
        validated,
        req.user!.userId
      );
      return res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getDeliveryStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const delivery = await SignalConfigService.getDeliveryStatus(req.params.id);
      return res.status(200).json({ success: true, data: delivery });
    } catch (error) {
      next(error);
    }
  }
}
