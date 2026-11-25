import { Request, Response, NextFunction } from 'express';
import { IncidentService } from '../services/incident.service.js';
import { createIncidentSchema, updateIncidentStatusSchema } from '../validators/incident.validator.js';

export class IncidentController {
  static async getAllIncidents(req: Request, res: Response, next: NextFunction) {
    try {
      const { intersectionId, type, severity, status } = req.query;
      const data = await IncidentService.getAllIncidents({
        intersectionId: intersectionId as string,
        type: type as string,
        severity: severity as string,
        status: status as string,
        userRole: req.user?.role,
        userId: req.user?.userId,
      });

      return res.status(200).json({ success: true, data, total: data.length });
    } catch (error) {
      next(error);
    }
  }

  static async getIncidentById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await IncidentService.getIncidentById(req.params.id);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async createIncident(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createIncidentSchema.parse(req.body);
      const incident = await IncidentService.createIncident(validated, req.user!.userId);
      return res.status(201).json({
        success: true,
        message: 'Traffic incident recorded successfully.',
        data: incident,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateIncidentStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateIncidentStatusSchema.parse(req.body);
      const incident = await IncidentService.updateIncidentStatus(
        req.params.id,
        validated.status,
        validated.additionalNotes,
        req.user!.userId
      );
      return res.status(200).json({
        success: true,
        message: `Incident status updated to ${validated.status}.`,
        data: incident,
      });
    } catch (error) {
      next(error);
    }
  }
}
