import { z } from 'zod';
import { isValidObjectId } from 'mongoose';
import { REWARD } from '../constants/reward.constant';

// Helper function to validate MongoDB ObjectId
const isValidMongoId = (id: string) => isValidObjectId(id);

// Reward  Schemas
const rewardBaseSchema = {
  name: z.string().trim().min(1, 'Tên quỹ thưởng là bắt buộc'),
  description: z.string().trim().optional(),
  currentAmount: z
    .number()
    .min(0, 'Số tiền phải lớn hơn hoặc bằng 0')
    .or(
      z
        .string()
        .pipe(z.coerce.number().min(0, 'Số tiền phải lớn hơn hoặc bằng 0'))
    ),
  eventType: z.enum(Object.values(REWARD.EVENT_TYPE) as [string, ...string[]], {
    errorMap: () => ({ message: 'Loại sự kiện không hợp lệ' }),
  }),
  startDate: z
    .string()
    .datetime({ message: 'Ngày bắt đầu phải có định dạng ISO hợp lệ' })
    .or(z.date().transform((date) => date.toISOString())),
  endDate: z
    .string()
    .datetime({ message: 'Ngày kết thúc phải có định dạng ISO hợp lệ' })
    .optional()
    .or(
      z
        .date()
        .transform((date) => date.toISOString())
        .optional()
    ),
};

export const createRewardSchema = z.object(rewardBaseSchema);

export const updateRewardSchema = z
  .object({
    ...rewardBaseSchema,
    status: z
      .enum(Object.values(REWARD.STATUS) as [string, ...string[]], {
        errorMap: () => ({ message: 'Trạng thái quỹ thưởng không hợp lệ' }),
      })
      .optional(),
  })
  .partial();

// Deduction Schema
export const deductToRewardSchema = z.object({
  amount: z
    .number()
    .min(1, 'Số tiền khấu trừ phải lớn hơn 0')
    .or(
      z
        .string()
        .pipe(z.coerce.number().min(1, 'Số tiền khấu trừ phải lớn hơn 0'))
    ),
  rewardId: z.string().trim().refine(isValidMongoId, {
    message: 'ID quỹ thưởng không hợp lệ',
  }),
  description: z.string().trim().optional(),
});

// Query Schemas
export const rewardQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: z
    .enum(Object.values(REWARD.STATUS) as [string, ...string[]])
    .optional(),
  eventType: z
    .enum(Object.values(REWARD.EVENT_TYPE) as [string, ...string[]])
    .optional(),
  search: z.string().trim().optional(),
});

export const employeeRewardStatsQuerySchema = z.object({
  employeeId: z
    .string()
    .trim()
    .refine(isValidMongoId, {
      message: 'ID nhân viên không hợp lệ',
    })
    .optional(),
});

// Type exports for use in controllers
export type CreateRewardInput = z.infer<typeof createRewardSchema>;
export type UpdateRewardInput = z.infer<typeof updateRewardSchema>;
export type DeductToRewardInput = z.infer<typeof deductToRewardSchema>;
export type RewardQueryInput = z.infer<typeof rewardQuerySchema>;
export type EmployeeRewardStatsQueryInput = z.infer<
  typeof employeeRewardStatsQuerySchema
>;
