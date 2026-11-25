import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/report.service.js';
import { generateReportSchema } from '../validators/report.validator.js';
import { PdfExportService } from '../services/pdf-export.service.js';
import { ExcelExportService } from '../services/excel-export.service.js';

export class ReportController {
  static async getAllReports(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ReportService.getAllReports(req.user!.role, req.user!.userId);
      return res.status(200).json({ success: true, data, total: data.length });
    } catch (error) {
      next(error);
    }
  }

  static async getReportById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ReportService.getReportById(req.params.id);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async generateReport(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = generateReportSchema.parse(req.body);
      const report = await ReportService.generateReport(validated, req.user!.userId, req.user!.role);
      return res.status(201).json({
        success: true,
        message: 'Report generated successfully.',
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  static async exportPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await ReportService.getReportById(req.params.id);
      const payload = ReportService.getReportPayload(report as any);
      PdfExportService.generateReportPdf(res, payload);
    } catch (error) {
      next(error);
    }
  }

  static async exportExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await ReportService.getReportById(req.params.id);
      const payload = ReportService.getReportPayload(report as any);
      await ExcelExportService.generateReportExcel(res, payload);
    } catch (error) {
      next(error);
    }
  }
}
