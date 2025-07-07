import { z } from 'zod';
import mongoose from 'mongoose';
import { TRANSACTION } from '../constants/transaction.constant';

// Helper function to validate MongoDB ObjectId
const isValidObjectId = (id: string) => mongoose.isValidObjectId(id);

// Base schema for common transaction fields
const transactionBaseSchema = {
  code: z.string().trim().min(1, 'Mã giao dịch là bắt buộc'),
  type: z.enum(Object.values(TRANSACTION.TYPE) as [string, ...string[]], {
    errorMap: () => ({ message: 'Loại giao dịch không hợp lệ' }),
  }),
  title: z.string().trim().min(1, 'Tiêu đề giao dịch là bắt buộc'),
  amount: z
    .number()
    .min(0, 'Số tiền phải lớn hơn hoặc bằng 0')
    .or(
      z
        .string()
        .pipe(z.coerce.number().min(0, 'Số tiền phải lớn hơn hoặc bằng 0'))
    ),
  paid: z
    .number()
    .min(0, 'Số tiền đã thanh toán phải lớn hơn hoặc bằng 0')
    .optional()
    .or(
      z
        .string()
        .pipe(
          z.coerce
            .number()
            .min(0, 'Số tiền đã thanh toán phải lớn hơn hoặc bằng 0')
            .optional()
        )
    ),
  paymentMethod: z.enum(
    Object.values(TRANSACTION.PAYMENT_METHOD) as [string, ...string[]],
    {
      errorMap: () => ({ message: 'Phương thức thanh toán không hợp lệ' }),
    }
  ),
  category: z.enum(
    [
      ...Object.values(TRANSACTION.CATEGORY.INCOME),
      ...Object.values(TRANSACTION.CATEGORY.OUTCOME),
    ] as [string, ...string[]],
    {
      errorMap: () => ({ message: 'Danh mục giao dịch không hợp lệ' }),
    }
  ),
  description: z.string().trim().optional(),
  date: z
    .string()
    .datetime({ message: 'Ngày giao dịch phải có định dạng ISO hợp lệ' })
    .optional()
    .default(() => new Date().toISOString())
    .or(z.date().transform((date) => date.toISOString())),
  customer: z
    .string()
    .trim()
    .refine(isValidObjectId, {
      message: 'ID khách hàng không hợp lệ',
    })
    .optional(),
  caseService: z
    .string()
    .trim()
    .refine(isValidObjectId, {
      message: 'ID hồ sơ vụ việc không hợp lệ',
    })
    .optional(),
};

// Schema for creating a transaction
export const transactionCreateSchema = z
  .object({
    ...transactionBaseSchema,
  })
  .refine(
    (data) => {
      // If paid amount is provided, ensure it doesn't exceed total amount
      if (data.paid !== undefined && data.paid > data.amount) {
        return false;
      }
      return true;
    },
    {
      message: 'Số tiền đã thanh toán không được vượt quá tổng số tiền',
      path: ['paid'],
    }
  );

// Schema for updating a transaction
export const transactionUpdateSchema = z
  .object({
    ...Object.fromEntries(
      Object.entries(transactionBaseSchema).map(([key, value]) => [
        key,
        value.optional(),
      ])
    ),
  })
  .refine(
    (data) => {
      // If both amount and paid are provided, ensure paid doesn't exceed amount
      if (
        data.paid !== undefined &&
        data.amount !== undefined &&
        data.paid > data.amount
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'Số tiền đã thanh toán không được vượt quá tổng số tiền',
      path: ['paid'],
    }
  );

// Schema for bulk delete transactions
export const transactionBulkDeleteSchema = z.object({
  transactionIds: z
    .array(
      z.string().refine(isValidObjectId, {
        message: 'ID giao dịch không hợp lệ',
      })
    )
    .min(1, 'Ít nhất một giao dịch phải được chọn để xóa'),
});

// Schema for query parameters
export const transactionQuerySchema = z
  .object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .refine((val) => val > 0, 'Trang phải lớn hơn 0'),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10))
      .refine((val) => val > 0 && val <= 100, 'Giới hạn phải từ 1 đến 100'),
    search: z.string().optional(),
    sortBy: z.string().trim().optional().default('tx_date'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    type: z
      .enum(Object.values(TRANSACTION.TYPE) as [string, ...string[]])
      .optional(),
    paymentMethod: z
      .enum(Object.values(TRANSACTION.PAYMENT_METHOD) as [string, ...string[]])
      .optional(),
    category: z
      .enum([
        ...Object.values(TRANSACTION.CATEGORY.INCOME),
        ...Object.values(TRANSACTION.CATEGORY.OUTCOME),
      ] as [string, ...string[]])
      .optional(),
    startDate: z
      .string()
      .datetime({ message: 'Ngày bắt đầu phải có định dạng ISO hợp lệ' })
      .optional(),
    endDate: z
      .string()
      .datetime({ message: 'Ngày kết thúc phải có định dạng ISO hợp lệ' })
      .optional(),
    customerId: z
      .string()
      .refine(isValidObjectId, {
        message: 'ID khách hàng không hợp lệ',
      })
      .optional(),
    caseServiceId: z
      .string()
      .refine(isValidObjectId, {
        message: 'ID hồ sơ vụ việc không hợp lệ',
      })
      .optional(),
    createdById: z
      .string()
      .refine(isValidObjectId, {
        message: 'ID người tạo không hợp lệ',
      })
      .optional(),
    amountMin: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined))
      .refine(
        (val) => val === undefined || val >= 0,
        'Số tiền tối thiểu phải lớn hơn hoặc bằng 0'
      ),
    amountMax: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined))
      .refine(
        (val) => val === undefined || val >= 0,
        'Số tiền tối đa phải lớn hơn hoặc bằng 0'
      ),
  })
  .refine(
    (data) => {
      // Validate that endDate is after startDate when both are provided
      if (data.startDate && data.endDate) {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        return end >= start;
      }
      return true;
    },
    {
      message: 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu',
      path: ['endDate'],
    }
  )
  .refine(
    (data) => {
      // Validate that amountMax is greater than or equal to amountMin when both are provided
      if (data.amountMin !== undefined && data.amountMax !== undefined) {
        return data.amountMax >= data.amountMin;
      }
      return true;
    },
    {
      message: 'Số tiền tối đa phải lớn hơn hoặc bằng số tiền tối thiểu',
      path: ['amountMax'],
    }
  );
