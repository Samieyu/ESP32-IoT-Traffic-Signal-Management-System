import { Request, Response, NextFunction } from 'express';
import { EmergencyService } from '../services/emergency.service.js';
import { requestEmergencySchema, terminateEmergencySchema } from '../validators/emergency.validator.js';

export class EmergencyController {
  static async getAllOperations(req: Request, res: Response, next: NextFunction) {
    try {
      const { intersectionId, status } = req.query;
      const data = await EmergencyService.getAllOperations({
        intersectionId: intersectionId as string,
        status: status as string,
        userRole: req.user?.role,
        userId: req.user?.userId,
      });

      return res.status(200).json({ success: true, data, total: data.length });
    } catch (error) {
      next(error);
    }
  }

  static async getOperationById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await EmergencyService.getOperationById(req.params.id);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async requestEmergencyPriority(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = requestEmergencySchema.parse(req.body);
      const result = await EmergencyService.requestEmergencyPriority(validated, req.user!.userId);
      return res.status(201).json({
        success: true,
        message: result.message,
        data: result.operation,
      });
    } catch (error) {
      next(error);
    }
  }

  static async terminateEmergencyPriority(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = terminateEmergencySchema.parse(req.body);
      const result = await EmergencyService.terminateEmergencyPriority(
        req.params.id,
        validated.reason,
        req.user?.userId
      );
      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.operation,
      });
    } catch (error) {
      next(error);
    }
  }
}
