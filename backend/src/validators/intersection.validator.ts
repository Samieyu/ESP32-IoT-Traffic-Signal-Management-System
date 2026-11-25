import { z } from 'zod';

export const createIntersectionSchema = z.object({
  code: z.string().min(3, 'Intersection code is required (e.g. INT-WCU-001)'),
  name: z.string().min(3, 'Intersection name is required'),
  description: z.string().optional().nullable(),
  region: z.string().min(2, 'Region is required'),
  city: z.string().min(2, 'City is required'),
  latitude: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
  longitude: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
  approachesCount: z.number().int().min(3).max(6).default(4),
  deviceId: z.string().optional().nullable(),
  assignedOfficerIds: z.array(z.string()).optional(),
});

export const updateIntersectionSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional().nullable(),
  region: z.string().min(2).optional(),
  city: z.string().min(2).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  approachesCount: z.number().int().min(3).max(6).optional(),
  deviceId: z.string().optional().nullable(),
  assignedOfficerIds: z.array(z.string()).optional(),
});

export const updateIntersectionStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']),
});
