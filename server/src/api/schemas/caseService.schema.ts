import { z } from 'zod';
import mongoose from 'mongoose';
import { CASE_SERVICE } from '../constants';

// Helper function to validate MongoDB ObjectId
const isValidObjectId = (id: string) => mongoose.isValidObjectId(id);

// Base schema for common case service fields
const caseServiceBaseSchema = {
  customer: z.string().trim().refine(isValidObjectId, {
    message: 'ID khách hàng không hợp lệ',
  }),
  leadAttorney: z.string().trim().refine(isValidObjectId, {
    message: 'ID luật sư chính không hợp lệ',
  }),
  assignees: z
    .array(
      z.string().refine(isValidObjectId, {
        message: 'ID người được giao không hợp lệ',
      })
    )
    .optional(),
  code: z.string().trim().min(1, 'Mã Hồ sơ vụ việc là bắt buộc'),
  notes: z.string().trim().optional(),
  status: z
    .enum(Object.values(CASE_SERVICE.STATUS) as [string, ...string[]])
    .default(CASE_SERVICE.STATUS.OPEN),
  startDate: z.preprocess(
    (val) => (val ? new Date(val as string) : undefined),
    z.date().optional()
  ),
  endDate: z.preprocess(
    (val) => (val ? new Date(val as string) : undefined),
    z.date().optional()
  ),
};

// Schema for creating a case service
export const caseServiceCreateSchema = z
  .object({
    ...caseServiceBaseSchema,
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

// Schema for updating a case service
export const caseServiceUpdateSchema = z
  .object({
    ...caseServiceBaseSchema,
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

// Schema for case service query params
export const caseServiceQuerySchema = z
  .object({
    page: z.coerce.number().positive().optional(),
    limit: z.coerce.number().positive().optional(),
    search: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    status: z
      .enum(Object.values(CASE_SERVICE.STATUS) as [string, ...string[]])
      .optional(),
    customerId: z
      .string()
      .refine((val) => !val || isValidObjectId(val), {
        message: 'ID khách hàng không hợp lệ',
      })
      .optional(),
    leadAttorneyId: z
      .string()
      .refine((val) => !val || isValidObjectId(val), {
        message: 'ID luật sư chính không hợp lệ',
      })
      .optional(),
    employeeUserId: z
      .string()
      .refine((val) => !val || isValidObjectId(val), {
        message: 'ID người dùng nhân viên không hợp lệ',
      })
      .optional(),
    startDate: z.preprocess(
      (val) => (val ? new Date(val as string) : undefined),
      z.date().optional()
    ),
    endDate: z.preprocess(
      (val) => (val ? new Date(val as string) : undefined),
      z.date().optional()
    ),
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

// Schema for deleting multiple case services
export const caseServiceBulkDeleteSchema = z.object({
  caseServiceIds: z
    .array(
      z.string().refine(isValidObjectId, {
        message: 'ID Hồ sơ vụ việc không hợp lệ',
      })
    )
    .min(1, 'Cần ít nhất một ID Hồ sơ vụ việc'),
});

// Schema for attaching document to case
export const documentIdsSchema = z.object({
  documentIds: z.array(
    z.string().refine(isValidObjectId, {
      message: 'ID tài liệu không hợp lệ',
    })
  ),
});

export const caseDocumentIdsSchema = z.object({
  caseDocumentIds: z.array(
    z.string().refine(isValidObjectId, {
      message: 'ID tài liệu vụ việc không hợp lệ',
    })
  ),
});

// Schema for case service import options
export const caseServiceImportOptionsSchema = z.object({
  skipDuplicates: z
    .string()
    .optional()
    .transform((val) => val === 'true')
    .default('true'),
  updateExisting: z
    .string()
    .optional()
    .transform((val) => val === 'true')
    .default('false'),
  skipEmptyRows: z
    .string()
    .optional()
    .transform((val) => val !== 'false')
    .default('true'),
});
