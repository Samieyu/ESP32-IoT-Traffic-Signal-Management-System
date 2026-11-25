import { z } from 'zod';

export const createProblemReportSchema = z.object({
  intersectionId: z.string().min(1, 'Intersection is required'),
  category: z.enum(['TRAFFIC_VIOLATION', 'TECHNICAL_INFRASTRUCTURE']),
  problemType: z.string().min(2, 'Problem type is required'),
  reportTimestamp: z.string().or(z.date()).optional().transform((val) => val ? new Date(val) : new Date()),
  description: z.string().min(5, 'Description must be at least 5 characters long'),
  licensePlateNumber: z.string().optional().nullable(),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  evidenceFileUrls: z.array(z.string()).optional(),
});

export const updateProblemStatusSchema = z.object({
  status: z.enum(['REPORTED', 'INVESTIGATING', 'RESOLVED', 'DISMISSED']),
});
