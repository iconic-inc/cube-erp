import { z } from 'zod';
import mongoose from 'mongoose';
import { USER } from '../constants';

// Helper function to validate MongoDB ObjectId
const isValidObjectId = (id: string) => mongoose.isValidObjectId(id);

// Helper function to validate phone number (Vietnamese format)
const isValidPhoneNumber = (phone: string) => {
  if (!phone) return true; // Optional field
  const phoneRegex = /^(\+84|0)[3|5|7|8|9][0-9]{8}$/;
  return phoneRegex.test(phone);
};

// Helper function to validate email
const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper function to validate username
const isValidUsername = (username: string) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

// Base schema for user fields
export const userBaseSchema = {
  username: z
    .string()
    .trim()
    .min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự')
    .refine(isValidUsername, {
      message: 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới',
    }),
  email: z.string().trim().min(1, 'Email là bắt buộc').refine(isValidEmail, {
    message: 'Email không hợp lệ',
  }),
  firstName: z.string().trim().min(1, 'Tên là bắt buộc'),
  lastName: z.string().trim().optional().default(''),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự').optional(),
  salt: z.string().optional(),
  avatar: z
    .string()
    .refine((val) => !val || isValidObjectId(val), {
      message: 'ID avatar không hợp lệ',
    })
    .optional(),
  address: z.string().max(512, 'Địa chỉ không được quá 512 ký tự').optional(),
  birthdate: z.preprocess(
    (val) => (val ? new Date(val as string) : undefined),
    z.date().optional()
  ),
  msisdn: z
    .string()
    .trim()
    .refine(isValidPhoneNumber, {
      message: 'Số điện thoại không hợp lệ',
    })
    .optional(),
  sex: z.enum(Object.values(USER.SEX) as [string, ...string[]]).optional(),
  status: z
    .enum(Object.values(USER.STATUS) as [string, ...string[]])
    .default(USER.STATUS.ACTIVE),
  role: z.string().refine(isValidObjectId, {
    message: 'ID vai trò không hợp lệ',
  }),
};

// Schema for creating a user
export const userCreateSchema = z
  .object({
    ...userBaseSchema,
  })
  .refine(
    (data) => {
      // If birthdate is provided, ensure it's not in the future
      if (data.birthdate) {
        return data.birthdate <= new Date();
      }
      return true;
    },
    {
      message: 'Ngày sinh không thể trong tương lai',
      path: ['birthdate'],
    }
  );

// Schema for updating a user
export const userUpdateSchema = z
  .object({
    ...userBaseSchema,
  })
  .partial() // Makes all fields optional for update
  .refine(
    (data) => {
      // If birthdate is provided, ensure it's not in the future
      if (data.birthdate) {
        return data.birthdate <= new Date();
      }
      return true;
    },
    {
      message: 'Ngày sinh không thể trong tương lai',
      path: ['birthdate'],
    }
  );

// Schema for user query params
export const userQuerySchema = z
  .object({
    page: z.coerce.number().positive().optional(),
    limit: z.coerce.number().positive().optional(),
    search: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    status: z
      .enum(Object.values(USER.STATUS) as [string, ...string[]])
      .optional(),
    sex: z.enum(Object.values(USER.SEX) as [string, ...string[]]).optional(),
    roleId: z
      .string()
      .refine((val) => !val || isValidObjectId(val), {
        message: 'ID vai trò không hợp lệ',
      })
      .optional(),
    birthdateFrom: z.preprocess(
      (val) => (val ? new Date(val as string) : undefined),
      z.date().optional()
    ),
    birthdateTo: z.preprocess(
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
      // If both birthdate ranges are provided, ensure they are valid
      if (data.birthdateFrom && data.birthdateTo) {
        return data.birthdateFrom <= data.birthdateTo;
      }
      return true;
    },
    {
      message: 'Khoảng thời gian ngày sinh không hợp lệ',
      path: ['birthdateRange'],
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

// Schema for deleting multiple users
export const userBulkDeleteSchema = z.object({
  userIds: z
    .array(
      z.string().refine(isValidObjectId, {
        message: 'ID người dùng không hợp lệ',
      })
    )
    .min(1, 'Cần ít nhất một ID người dùng'),
});

// Schema for user ID validation
export const userIdSchema = z.object({
  userId: z.string().refine(isValidObjectId, {
    message: 'ID người dùng không hợp lệ',
  }),
});

// Schema for password reset
export const userPasswordResetSchema = z.object({
  userId: z.string().refine(isValidObjectId, {
    message: 'ID người dùng không hợp lệ',
  }),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
});
