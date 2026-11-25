import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters long'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  fullName: z.string().min(2, 'Full name is required'),
  phoneNumber: z.string().optional().nullable(),
  role: z.enum(['ADMIN', 'TRAFFIC_POLICE']).default('TRAFFIC_POLICE'),
  assignedIntersectionIds: z.array(z.string()).optional(),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  phoneNumber: z.string().optional().nullable(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  assignedIntersectionIds: z.array(z.string()).optional(),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']),
});
