import ExcelJS from 'exceljs';
import { Response } from 'express';

export class ExcelExportService {
  static async generateReportExcel(res: Response, reportData: {
    title: string;
    referenceId: string;
    generatedAt: Date;
    generatedBy: string;
    dateRange: string;
    intersectionName?: string;
    headers: string[];
    rows: any[][];
    summary: Record<string, any>;
  }) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Wachemo University - Traffic Management System';
    workbook.created = reportData.generatedAt;

    const worksheet = workbook.addWorksheet('Traffic Report');

    // Title Row
    worksheet.mergeCells('A1:G1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'WACHEMO UNIVERSITY — TRAFFIC LIGHT AUTOMATION SYSTEM';
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 28;

    // Subtitle Row
    worksheet.mergeCells('A2:G2');
    const subCell = worksheet.getCell('A2');
    subCell.value = `${reportData.title} | Ref: ${reportData.referenceId} | Scope: ${reportData.dateRange}`;
    subCell.font = { name: 'Arial', size: 10, italic: true };
    subCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(2).height = 20;

    // Summary Rows
    worksheet.addRow([]);
    worksheet.addRow(['Report Summary Metrics:']);
    worksheet.getRow(4).font = { bold: true };

    for (const [k, v] of Object.entries(reportData.summary)) {
      worksheet.addRow([k, v]);
    }
    worksheet.addRow([]);

    // Table Header
    const headerRow = worksheet.addRow(reportData.headers);
    headerRow.height = 24;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Rows
    reportData.rows.forEach((row, idx) => {
      const dataRow = worksheet.addRow(row);
      dataRow.height = 20;
      dataRow.eachCell((cell) => {
        cell.alignment = { vertical: 'middle' };
        if (idx % 2 === 1) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        }
        cell.border = {
          top: { style: 'hair' },
          left: { style: 'hair' },
          bottom: { style: 'hair' },
          right: { style: 'hair' },
        };
      });
    });

    // Auto-fit column widths
    worksheet.columns.forEach((column) => {
      let maxLen = 12;
      column.eachCell?.({ includeEmpty: false }, (cell) => {
        const valStr = cell.value ? String(cell.value) : '';
        if (valStr.length > maxLen) {
          maxLen = Math.min(valStr.length + 3, 40);
        }
      });
      column.width = maxLen;
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Report_${reportData.referenceId}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  }
}
