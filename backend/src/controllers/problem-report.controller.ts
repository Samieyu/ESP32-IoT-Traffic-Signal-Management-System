import { Request, Response, NextFunction } from 'express';
import { ProblemReportService } from '../services/problem-report.service.js';
import { createProblemReportSchema, updateProblemStatusSchema } from '../validators/problem.validator.js';

export class ProblemReportController {
  static async getAllReports(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, intersectionId, urgency, status } = req.query;
      const data = await ProblemReportService.getAllReports({
        category: category as string,
        intersectionId: intersectionId as string,
        urgency: urgency as string,
        status: status as string,
        userRole: req.user?.role,
        userId: req.user?.userId,
      });

      return res.status(200).json({ success: true, data, total: data.length });
    } catch (error) {
      next(error);
    }
  }

  static async getReportById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ProblemReportService.getReportById(req.params.id);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async createReport(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createProblemReportSchema.parse(req.body);
      const report = await ProblemReportService.createReport(validated, req.user!.userId);
      return res.status(201).json({
        success: true,
        message: 'Traffic problem reported successfully.',
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateReportStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateProblemStatusSchema.parse(req.body);
      const report = await ProblemReportService.updateReportStatus(
        req.params.id,
        validated.status,
        req.user!.userId
      );
      return res.status(200).json({
        success: true,
        message: `Problem report status set to ${validated.status}.`,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }
}
