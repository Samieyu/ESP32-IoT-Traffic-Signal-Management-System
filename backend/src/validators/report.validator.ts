import { z } from 'zod';

export const generateReportSchema = z.object({
  reportType: z.enum([
    'INCIDENTS',
    'PROBLEMS',
    'VIOLATIONS',
    'TECHNICAL',
    'EMERGENCY',
    'OPERATIONAL',
    'CONTROLLERS',
    'POLICE_ACTIVITY',
  ]),
  intersectionId: z.string().optional().nullable(),
  startDate: z.string().or(z.date()).transform((val) => new Date(val)),
  endDate: z.string().or(z.date()).transform((val) => new Date(val)),
  exportFormat: z.enum(['PDF', 'EXCEL']).default('PDF'),
  filters: z.record(z.any()).optional(),
});
