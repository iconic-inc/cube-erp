import { z } from 'zod';
import mongoose from 'mongoose';
import { CUSTOMER } from '../constants';

// Helper function to validate MongoDB ObjectId
const isValidObjectId = (id: string) => mongoose.isValidObjectId(id);

// Helper function to validate phone number (Vietnamese format)
const isValidPhoneNumber = (phone: string) => {
  const phoneRegex = /^(\+84|0)[3|5|7|8|9][0-9]{8}$/;
  return phoneRegex.test(phone);
};

// Helper function to validate email
const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Base schema for common customer fields
const customerBaseSchema = {
  code: z.string().trim().min(1, 'Mã khách hàng là bắt buộc'),
  firstName: z.string().trim().min(1, 'Tên là bắt buộc'),
  lastName: z.string().trim().optional(),
  email: z
    .string()
    .trim()
    .refine((val) => !val || isValidEmail(val), {
      message: 'Email không hợp lệ',
    })
    .optional(),
  msisdn: z
    .string()
    .trim()
    .min(1, 'Số điện thoại là bắt buộc')
    .refine(isValidPhoneNumber, {
      message: 'Số điện thoại không hợp lệ',
    }),
  province: z.string().trim().min(1, 'Tỉnh/Thành phố là bắt buộc'),
  district: z.string().trim().min(1, 'Quận/Huyện là bắt buộc'),
  street: z.string().trim().optional(),
  sex: z
    .enum(
      Object.values(CUSTOMER.SEX).flatMap((item) => item.value) as [
        string,
        ...string[]
      ],
      {
        message: 'Giới tính không hợp lệ',
      }
    )
    .optional(),
  birthDate: z.preprocess(
    (val) => (val ? new Date(val as string) : undefined),
    z.date().optional()
  ),
  contactChannel: z.string().trim().optional().default('Facebook'),
  source: z.string().trim().optional().default('Facebook'),
  notes: z.string().trim().optional(),
};

// Schema for creating a customer
export const customerCreateSchema = z
  .object({
    ...customerBaseSchema,
  })
  .refine(
    (data) => {
      // If birthDate is provided, ensure it's not in the future
      if (data.birthDate) {
        return data.birthDate <= new Date();
      }
      return true;
    },
    {
      message: 'Ngày sinh không thể trong tương lai',
      path: ['birthDate'],
    }
  );

// Schema for updating a customer
export const customerUpdateSchema = z
  .object({
    ...customerBaseSchema,
  })
  .partial() // Makes all fields optional for update
  .refine(
    (data) => {
      // If birthDate is provided, ensure it's not in the future
      if (data.birthDate) {
        return data.birthDate <= new Date();
      }
      return true;
    },
    {
      message: 'Ngày sinh không thể trong tương lai',
      path: ['birthDate'],
    }
  );

// Schema for customer query params
export const customerQuerySchema = z
  .object({
    page: z.coerce.number().positive().optional(),
    limit: z.coerce.number().positive().optional(),
    search: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    sex: z
      .enum(
        Object.values(CUSTOMER.SEX).flatMap((item) => item.value) as [
          string,
          ...string[]
        ]
      )
      .optional(),
    contactChannel: z.string().optional(),
    source: z.string().optional(),
    birthDateFrom: z.preprocess(
      (val) => (val ? new Date(val as string) : undefined),
      z.date().optional()
    ),
    birthDateTo: z.preprocess(
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
      // If both birth date ranges are provided, ensure they are valid
      if (data.birthDateFrom && data.birthDateTo) {
        return data.birthDateFrom <= data.birthDateTo;
      }
      return true;
    },
    {
      message: 'Khoảng thời gian ngày sinh không hợp lệ',
      path: ['birthDateRange'],
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

// Schema for deleting multiple customers
export const customerBulkDeleteSchema = z.object({
  customerIds: z
    .array(
      z.string().refine(isValidObjectId, {
        message: 'ID khách hàng không hợp lệ',
      })
    )
    .min(1, 'Cần ít nhất một ID khách hàng'),
});

// Schema for customer ID validation
export const customerIdSchema = z.object({
  customerId: z.string().refine(isValidObjectId, {
    message: 'ID khách hàng không hợp lệ',
  }),
});

// Schema for importing customers from file
export const customerImportSchema = z.object({
  customers: z
    .array(customerCreateSchema)
    .min(1, 'Cần ít nhất một khách hàng để import'),
});

// Schema for import options
export const customerImportOptionsSchema = z.object({
  skipDuplicates: z
    .union([z.boolean(), z.string().transform((val) => val === 'true')])
    .default(true),
  updateExisting: z
    .union([z.boolean(), z.string().transform((val) => val === 'true')])
    .default(false),
  skipEmptyRows: z
    .union([z.boolean(), z.string().transform((val) => val === 'true')])
    .default(true),
});

// Schema for exporting customers
export const customerExportSchema = z.object({
  customerIds: z
    .array(
      z.string().refine(isValidObjectId, {
        message: 'ID khách hàng không hợp lệ',
      })
    )
    .optional(), // If not provided, export all customers
  format: z.enum(['excel', 'csv', 'pdf']).default('excel'),
  fields: z.array(z.string()).optional(), // If not provided, export all fields
});
