import { z } from 'zod';
import { isValidObjectId } from 'mongoose';
import { CASE_SERVICE } from '../constants';

// Schema for case tax
const caseTaxSchema = z.object({
  name: z.string().min(1, 'Tên thuế là bắt buộc'),
  mode: z.enum(['PERCENT', 'FIXED']),
  value: z.preprocess(
    (val: any) => (typeof val === 'number' ? val : parseFloat(val)),
    z.number().min(0, 'Giá trị thuế phải lớn hơn hoặc bằng 0')
  ),
  scope: z.enum(['ON_BASE', 'ON_BASE_PLUS_INCIDENTALS']).default('ON_BASE'),
});

// Schema for case participant
const caseParticipantSchema = z.object({
  employeeId: z.string().refine(isValidObjectId, {
    message: 'ID nhân viên không hợp lệ',
  }),
  role: z.string().optional(),
  commission: z.object({
    type: z.enum(['PERCENT_OF_GROSS', 'PERCENT_OF_NET', 'FLAT']),
    value: z.preprocess(
      (val: any) => (typeof val === 'number' ? val : parseFloat(val)),
      z.number().min(0, 'Giá trị hoa hồng phải lớn hơn hoặc bằng 0')
    ),
    capAmount: z.preprocess(
      (val: any) =>
        val === undefined
          ? undefined
          : typeof val === 'number'
          ? val
          : parseFloat(val),
      z.number().min(0).optional()
    ),
    floorAmount: z.preprocess(
      (val: any) =>
        val === undefined
          ? undefined
          : typeof val === 'number'
          ? val
          : parseFloat(val),
      z.number().min(0).optional()
    ),
    eligibleOn: z.enum(['AT_CLOSURE', 'ON_PAYMENT']).default('AT_CLOSURE'),
  }),
});

// Schema for installment plan item
const installmentPlanItemSchema = z.object({
  seq: z.preprocess(
    (val: any) => (typeof val === 'number' ? val : parseInt(val)),
    z.number().int().min(1, 'Số thứ tự phải lớn hơn 0')
  ),
  dueDate: z.preprocess(
    (val) => (val ? new Date(val as string) : new Date()),
    z.date()
  ),
  amount: z.preprocess(
    (val: any) => (typeof val === 'number' ? val : parseFloat(val)),
    z.number().min(0, 'Số tiền phải lớn hơn hoặc bằng 0')
  ),
  status: z
    .enum(['PLANNED', 'DUE', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'])
    .default('PLANNED'),
  paidAmount: z.preprocess(
    (val: any) => (typeof val === 'number' ? val : parseFloat(val || '0')),
    z.number().min(0, 'Số tiền đã thanh toán phải lớn hơn hoặc bằng 0')
  ),
  notes: z.string().optional(),
});

// Schema for incurred cost
const incurredCostSchema = z.object({
  date: z.preprocess(
    (val) => (val ? new Date(val as string) : new Date()),
    z.date()
  ),
  category: z.string().min(1, 'Danh mục chi phí là bắt buộc'),
  description: z.string().optional(),
  amount: z.preprocess(
    (val: any) => (typeof val === 'number' ? val : parseFloat(val)),
    z.number().min(0, 'Số tiền phải lớn hơn hoặc bằng 0')
  ),
  vendorId: z
    .string()
    .refine(isValidObjectId, {
      message: 'ID nhà cung cấp không hợp lệ',
    })
    .optional(),
  attachmentUrls: z.array(z.string().url()).optional(),
});

// Schema for pricing
const pricingSchema = z.object({
  baseAmount: z.number().min(0, 'Số tiền cơ bản phải lớn hơn hoặc bằng 0'),
  discounts: z.number().default(0),
  addOns: z.number().default(0),
  taxes: z.array(caseTaxSchema).default([]),
});

// Base schema for common case service fields
const caseServiceBaseSchema = {
  customer: z.string().trim().refine(isValidObjectId, {
    message: 'ID khách hàng không hợp lệ',
  }),
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
  pricing: pricingSchema,
  participants: z.array(caseParticipantSchema).default([]),
  installments: z.array(installmentPlanItemSchema).default([]),
  incurredCosts: z.array(incurredCostSchema).default([]),
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

// Schema for creating installment
export const createInstallmentSchema = z.object({
  seq: z.number().int().min(1, 'Số thứ tự phải lớn hơn 0'),
  dueDate: z.preprocess(
    (val) => (val ? new Date(val as string) : new Date()),
    z.date()
  ),
  amount: z.number().min(0, 'Số tiền phải lớn hơn hoặc bằng 0'),
  notes: z.string().optional(),
});

// Schema for adding participant
export const addParticipantSchema = z.object({
  employeeId: z.string().refine(isValidObjectId, {
    message: 'ID nhân viên không hợp lệ',
  }),
  role: z.string().optional(),
  commission: z.object({
    type: z.enum(['PERCENT_OF_GROSS', 'PERCENT_OF_NET', 'FLAT']),
    value: z.number().min(0, 'Giá trị hoa hồng phải lớn hơn hoặc bằng 0'),
    capAmount: z.number().min(0).optional(),
    floorAmount: z.number().min(0).optional(),
    eligibleOn: z.enum(['AT_CLOSURE', 'ON_PAYMENT']).default('AT_CLOSURE'),
  }),
});

// Schema for adding payment
export const addPaymentSchema = z.object({
  installmentId: z.string().refine(isValidObjectId, {
    message: 'ID kỳ thanh toán không hợp lệ',
  }),
  amount: z.number().min(0.01, 'Số tiền thanh toán phải lớn hơn 0'),
  paymentDate: z.preprocess(
    (val) => (val ? new Date(val as string) : new Date()),
    z.date().optional()
  ),
  notes: z.string().optional(),
});

// Schema for updating participants
export const updateParticipantsSchema = z.object({
  participants: z
    .array(caseParticipantSchema)
    .min(1, 'Phải có ít nhất một người tham gia'),
});
