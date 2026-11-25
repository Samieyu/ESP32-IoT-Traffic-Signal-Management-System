import { z } from 'zod';

export const requestEmergencySchema = z.object({
  intersectionId: z.string().min(1, 'Intersection is required'),
  direction: z.enum(['NORTH', 'SOUTH', 'EAST', 'WEST']),
  movement: z.enum(['STRAIGHT', 'LEFT', 'RIGHT']).default('STRAIGHT'),
  durationSeconds: z.number().int().min(15).max(120).optional(),
});

export const terminateEmergencySchema = z.object({
  reason: z.string().optional().default('Manually terminated by officer: emergency vehicle cleared.'),
});
