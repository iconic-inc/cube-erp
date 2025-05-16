/* src/services/spa.service.ts (excerpt) */
import { z } from 'zod';
import { ISpaAttrs } from '../interfaces/spa.interface';
import { isValidObjectId } from 'mongoose';

/* ------------------------------------------------------------------ */
/* Sub-schemas                                                         */
/* ------------------------------------------------------------------ */

/** GeoJSON Point */
export const locationSchema = z.object({
  type: z.literal('Point').default('Point'),
  coordinates: z
    .tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]) // [lng, lat]
    .describe('[longitude, latitude]')
    .optional(),
  formattedAddress: z.string().trim().max(512).optional(),
});

/** Opening hour for one weekday */
export const openingHourSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6), // 0 = Sun … 6 = Sat
  open: z.string().regex(/^[0-2]\d:[0-5]\d$/, 'HH:MM'), // 24h format
  close: z.string().regex(/^[0-2]\d:[0-5]\d$/, 'HH:MM'),
  isClosed: z.boolean().optional(),
});

/** Service offered by spa */
export const serviceSchema = z
  .object({
    name: z.string().trim().min(2),
    priceFrom: z.number().positive().optional(),
    priceTo: z.number().positive().optional(),
    durationMin: z.number().int().positive().optional(), // minutes
    description: z.string().trim().max(2000).optional(),
  })
  .refine((v) => (v.priceFrom && v.priceTo ? v.priceTo >= v.priceFrom : true), {
    message: 'priceTo must be >= priceFrom',
  });

/* ------------------------------------------------------------------ */
/* Main SpaAttrs schema                                                */
/* ------------------------------------------------------------------ */

export const spaCreateSchema = z.object<Record<keyof ISpaAttrs, any>>({
  /* CORE */
  name: z.string().trim().min(3),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, 'kebab-case, alphanum & dash only')
    .optional(),
  owner: z.string().refine((v) => isValidObjectId(v), {
    message: 'Invalid owner ID',
  }),
  description: z.string().trim().max(5000).optional(),
  categories: z.array(z.string().trim()).min(1).optional(),

  /* CONTACT & LOCATION */
  phone: z
    .string()
    .trim()
    .regex(/(84|0[3|5|7|8|9])+([0-9]{8})\b/g, 'Invalid phone number'),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  socialLinks: z
    .record(z.string().url())
    .optional()
    .refine((r) => Object.keys(r || {}).length <= 10, {
      message: 'Too many social links',
    }),
  address: locationSchema,

  /* BUSINESS INFO */
  openingHours: z.array(openingHourSchema).max(7).optional(),
  services: z.array(serviceSchema).min(1).optional(),

  /* MEDIA */
  avatar: z
    .string()
    .refine((v) => isValidObjectId(v), {
      message: 'Invalid avatar ID',
    })
    .optional(), // image ObjectId
  coverImage: z
    .string()
    .refine((v) => isValidObjectId(v), {
      message: 'Invalid cover image ID',
    })
    .optional(), // image ObjectId
  gallery: z
    .array(
      z.string().refine((v) => isValidObjectId(v), {
        message: 'Invalid image ID',
      })
    )
    .max(10)
    .optional(),

  /* RATING (denormalised) */
  averageRating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().nonnegative().optional(),
  lastReviewAt: z.date().optional(),

  /* MODERATION */
  status: z
    .enum(['draft', 'pending', 'approved', 'rejected'])
    .default('draft')
    .optional(),
  adminNote: z.string().trim().max(1000).optional(),
  isFeatured: z.boolean().optional(),
});
