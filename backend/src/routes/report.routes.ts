import { Router } from 'express';
import { ReportController } from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', ReportController.getAllReports);
router.post('/generate', ReportController.generateReport);
router.get('/:id', ReportController.getReportById);
router.get('/:id/pdf', ReportController.exportPdf);
router.get('/:id/excel', ReportController.exportExcel);

export default router;
