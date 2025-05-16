/* src/validators/spaOwnerCreate.schema.ts */
import { z } from 'zod';
import mongoose from 'mongoose';

/* ------------------------------------------------------------------ */
/*  Common helper — validate via mongoose.isValidObjectId             */
/* ------------------------------------------------------------------ */
const objectId = z.string().refine((v) => mongoose.isValidObjectId(v), {
  message: 'Invalid Mongo ObjectId',
});

export const spaOwnerCreateSchema = z.object({
  spas: z.array(objectId).min(1, 'Must own at least one spa'),
  level: z.enum(['owner', 'manager']).default('owner'),
  plan: z.string().trim().optional(),
  planExpireAt: z.preprocess(
    (v) => (v ? new Date(v as string) : undefined),
    z.date().optional()
  ),
  status: z.enum(['active', 'suspended']).default('active'),
});
