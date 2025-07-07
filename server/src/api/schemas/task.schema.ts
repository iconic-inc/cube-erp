import { z } from 'zod';
import mongoose from 'mongoose';
import { TASK } from '../constants/task.constant';

// Helper function to validate MongoDB ObjectId
const isValidObjectId = (id: string) => mongoose.isValidObjectId(id);

// Base schema for common task fields
const taskBaseSchema = {
  name: z.string().trim().min(1, 'Tên nhiệm vụ là bắt buộc'),
  description: z.string().trim().optional(),
  document: z
    .string()
    .trim()
    .refine((val) => !val || isValidObjectId(val), {
      message: 'ID tài liệu không hợp lệ',
    })
    .optional(),
  startDate: z.preprocess(
    (val) => (val ? new Date(val as string) : undefined),
    z.date().optional()
  ),
  endDate: z.preprocess(
    (val) => (val ? new Date(val as string) : undefined),
    z.date()
  ),
  status: z
    .enum(Object.values(TASK.STATUS) as [string, ...string[]])
    .default(TASK.STATUS.NOT_STARTED),
  priority: z
    .enum(Object.values(TASK.PRIORITY) as [string, ...string[]])
    .default(TASK.PRIORITY.MEDIUM),
  caseService: z
    .string()
    .nullish()
    .refine((id) => !id || isValidObjectId(id), {
      message: 'ID dịch vụ case không hợp lệ',
    })
    .optional(),
  caseOrder: z.number().int().min(0).optional(),
};

// Schema for creating a task
export const taskCreateSchema = z
  .object({
    ...taskBaseSchema,
    assignees: z
      .array(
        z.string().refine(isValidObjectId, {
          message: 'ID người được giao không hợp lệ',
        })
      )
      .min(1, 'Cần ít nhất một người được giao'),
  })
  .refine(
    (data) => {
      // If both dates are provided, ensure endDate is after startDate
      if (data.startDate && data.endDate) {
        return data.endDate > data.startDate;
      }
      return true;
    },
    {
      message: 'Ngày kết thúc phải sau ngày bắt đầu',
      path: ['endDate'],
    }
  );

// Schema for updating a task
export const taskUpdateSchema = z
  .object({
    ...taskBaseSchema,
    assignees: z
      .array(
        z.string().refine(isValidObjectId, {
          message: 'ID người được giao không hợp lệ',
        })
      )
      .optional(),
  })
  .partial() // Makes all fields optional for update
  .refine(
    (data) => {
      // If both dates are provided, ensure endDate is after startDate
      if (data.startDate && data.endDate) {
        return data.endDate > data.startDate;
      }
      return true;
    },
    {
      message: 'Ngày kết thúc phải sau ngày bắt đầu',
      path: ['endDate'],
    }
  );

// Schema for task query params
export const taskQuerySchema = z
  .object({
    page: z.coerce.number().positive().optional(),
    limit: z.coerce.number().positive().optional(),
    search: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    assignee: z
      .string()
      .refine((val) => !val || isValidObjectId(val), {
        message: 'ID người được giao không hợp lệ',
      })
      .optional(),
    assignees: z
      .array(
        z.string().refine(isValidObjectId, {
          message: 'ID người được giao không hợp lệ',
        })
      )
      .optional(),
    excludeAssignee: z
      .string()
      .refine((val) => !val || isValidObjectId(val), {
        message: 'ID người loại trừ không hợp lệ',
      })
      .optional(),
    status: z
      .enum(Object.values(TASK.STATUS) as [string, ...string[]])
      .optional(),
    statuses: z
      .array(z.enum(Object.values(TASK.STATUS) as [string, ...string[]]))
      .optional(),
    priority: z
      .enum(Object.values(TASK.PRIORITY) as [string, ...string[]])
      .optional(),
    priorities: z
      .array(z.enum(Object.values(TASK.PRIORITY) as [string, ...string[]]))
      .optional(),
    createdBy: z
      .string()
      .refine((val) => !val || isValidObjectId(val), {
        message: 'ID người tạo không hợp lệ',
      })
      .optional(),
    isOverdue: z.boolean().optional(),
    isDueSoon: z.boolean().optional(), // Tasks due within the next 3 days
    isCompleted: z.boolean().optional(),
    caseService: z
      .string()
      .refine((val) => !val || isValidObjectId(val), {
        message: 'ID dịch vụ case không hợp lệ',
      })
      .optional(),
    startDateFrom: z.preprocess(
      (val) => (val ? new Date(val as string) : undefined),
      z.date().optional()
    ),
    startDateTo: z.preprocess(
      (val) => (val ? new Date(val as string) : undefined),
      z.date().optional()
    ),
    endDateFrom: z.preprocess(
      (val) => (val ? new Date(val as string) : undefined),
      z.date().optional()
    ),
    endDateTo: z.preprocess(
      (val) => (val ? new Date(val as string) : undefined),
      z.date().optional()
    ),
    createdAtFrom: z.preprocess(
      (val) => (val ? new Date(val as string) : undefined),
      z.date().optional()
    ),
    createdAtTo: z.preprocess(
      (val) => (val ? new Date(val as string) : undefined),
      z.date().optional()
    ),
  })
  .refine(
    (data) => {
      // If both start date ranges are provided, ensure they are valid
      if (data.startDateFrom && data.startDateTo) {
        return data.startDateFrom <= data.startDateTo;
      }
      return true;
    },
    {
      message: 'Khoảng thời gian bắt đầu không hợp lệ',
      path: ['startDateRange'],
    }
  )
  .refine(
    (data) => {
      // If both end date ranges are provided, ensure they are valid
      if (data.endDateFrom && data.endDateTo) {
        return data.endDateFrom <= data.endDateTo;
      }
      return true;
    },
    {
      message: 'Khoảng thời gian kết thúc không hợp lệ',
      path: ['endDateRange'],
    }
  )
  .refine(
    (data) => {
      // If both created at ranges are provided, ensure they are valid
      if (data.createdAtFrom && data.createdAtTo) {
        return data.createdAtFrom <= data.createdAtTo;
      }
      return true;
    },
    {
      message: 'Khoảng thời gian tạo không hợp lệ',
      path: ['createdAtRange'],
    }
  );
