import { Request, Response, NextFunction } from 'express';
import { IntersectionService } from '../services/intersection.service.js';
import { createIntersectionSchema, updateIntersectionSchema, updateIntersectionStatusSchema } from '../validators/intersection.validator.js';

export class IntersectionController {
  static async getAllIntersections(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, search } = req.query;
      const intersections = await IntersectionService.getAllIntersections({
        status: status as string,
        search: search as string,
        userId: req.user?.userId,
        userRole: req.user?.role,
      });

      return res.status(200).json({
        success: true,
        data: intersections,
        total: intersections.length,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getIntersectionById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await IntersectionService.getIntersectionById(req.params.id);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createIntersection(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createIntersectionSchema.parse(req.body);
      const item = await IntersectionService.createIntersection(validated, req.user!.userId);
      return res.status(201).json({
        success: true,
        message: 'Intersection registered successfully.',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateIntersection(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateIntersectionSchema.parse(req.body);
      const item = await IntersectionService.updateIntersection(req.params.id, validated, req.user!.userId);
      return res.status(200).json({
        success: true,
        message: 'Intersection updated successfully.',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateIntersectionStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateIntersectionStatusSchema.parse(req.body);
      const item = await IntersectionService.updateIntersectionStatus(req.params.id, validated.status, req.user!.userId);
      return res.status(200).json({
        success: true,
        message: `Intersection status updated to ${validated.status}.`,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteIntersection(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await IntersectionService.deleteIntersection(req.params.id, req.user!.userId);
      return res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
