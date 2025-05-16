import { z } from 'zod';
import mongoose from 'mongoose';

const objectId = z.string().refine((v) => mongoose.isValidObjectId(v), {
  message: 'Invalid Mongo ObjectId',
});

export const userCreateSchema = z.object({
  username: z.string().trim().min(3),
  email: z.string().email(),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().default(''),
  password: z.string().min(6).optional(),
  salt: z.string().optional(),
  avatar: objectId.optional(),
  address: z.string().max(512).optional(),
  birthdate: z.preprocess(
    (v) => (v ? new Date(v as string) : undefined),
    z.date().optional()
  ),
  msisdn: z.string().trim().optional(),
  sex: z.string().trim().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  role: objectId, // role ObjectId
});
