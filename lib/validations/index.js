import { z } from 'zod';

export const emailSchema = z.string().email('Please enter a valid email').trim().toLowerCase();

export const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

export const nameSchema = z.string().min(1, 'Name is required').max(100).trim();

export const bioSchema = z.string().max(500, 'Bio must be under 500 characters').trim().optional().default('');

export const locationSchema = z.string().max(100).trim().optional().default('');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  bio: bioSchema,
  location: locationSchema,
  skillsOffered: z.array(z.string().uuid()).default([]),
  skillsWanted: z.array(z.string().uuid()).default([]),
});

export const profileUpdateSchema = z.object({
  name: nameSchema.optional(),
  bio: bioSchema,
  location: locationSchema,
  avatar: z.string().url().optional(),
});

export const sessionSchema = z.object({
  topic: z.string().min(1, 'Topic is required').max(200).trim(),
  scheduledAt: z.string().min(1, 'Date/time is required'),
  duration: z.number().int().min(15).max(480).default(60),
  matchId: z.string().uuid(),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).trim().optional().default(''),
  skillTaught: z.string().max(100).trim().optional().default(''),
  matchId: z.string().uuid(),
  revieweeId: z.string().uuid(),
});

export const messageSchema = z.object({
  content: z.string().min(1).max(5000).trim(),
});
