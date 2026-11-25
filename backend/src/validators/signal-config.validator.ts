import { z } from 'zod';

export const signalConfigSchema = z.object({
  northSouthGreenDuration: z
    .number()
    .int()
    .min(10, 'North-South green duration must be at least 10 seconds')
    .max(180, 'North-South green duration cannot exceed 180 seconds'),
  eastWestGreenDuration: z
    .number()
    .int()
    .min(10, 'East-West green duration must be at least 10 seconds')
    .max(180, 'East-West green duration cannot exceed 180 seconds'),
  yellowDuration: z
    .number()
    .int()
    .min(3, 'Yellow clearance duration must be at least 3 seconds for safety')
    .max(7, 'Yellow clearance duration cannot exceed 7 seconds'),
  allRedClearanceDuration: z
    .number()
    .int()
    .min(1, 'All-red clearance duration must be at least 1 second to clear intersections safely')
    .max(5, 'All-red clearance duration cannot exceed 5 seconds'),
  maxEmergencyPriorityDuration: z
    .number()
    .int()
    .min(15, 'Maximum emergency priority duration must be at least 15 seconds')
    .max(120, 'Maximum emergency priority duration cannot exceed 120 seconds'),
  lcdEnabled: z.boolean().default(true),
  lcdDisplayMode: z.string().default('COUNTDOWN_AND_PHASE'),
  lcdCustomMessage: z.string().max(32, 'LCD message max 32 characters').optional().nullable(),
  countdownDisplayEnabled: z.boolean().default(true),
  outputMapping: z.any().optional(),
});

export type SignalConfigInput = z.infer<typeof signalConfigSchema>;
