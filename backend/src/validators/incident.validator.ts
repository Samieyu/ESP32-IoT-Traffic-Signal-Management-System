import { z } from 'zod';

export const createIncidentSchema = z.object({
  intersectionId: z.string().min(1, 'Intersection is required'),
  incidentType: z.enum(['ROAD_ACCIDENT', 'ROAD_OBSTRUCTION', 'EMERGENCY_INTERVENTION', 'OTHER']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  incidentTimestamp: z.string().or(z.date()).transform((val) => new Date(val)),
  description: z.string().min(5, 'Description must be at least 5 characters long'),
  additionalNotes: z.string().optional().nullable(),
  evidenceFileUrls: z.array(z.string()).optional(),
});

export const updateIncidentStatusSchema = z.object({
  status: z.enum(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED']),
  additionalNotes: z.string().optional(),
});
