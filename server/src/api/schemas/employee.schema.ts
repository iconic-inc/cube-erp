import { z } from 'zod';
import mongoose from 'mongoose';
import { USER } from '../constants';
import { userBaseSchema } from './user.schema';

// Helper function to validate MongoDB ObjectId
const isValidObjectId = (id: string) => mongoose.isValidObjectId(id);

// Base schema for employee-specific fields
const employeeBaseSchema = {
  ...userBaseSchema,
  code: z.string().trim().min(1, 'Mã nhân viên là bắt buộc'),
  position: z.string().trim().min(1, 'Chức vụ là bắt buộc'),
  department: z.string().trim().min(1, 'Phòng ban là bắt buộc'),
  joinDate: z.preprocess(
    (val) => (val ? new Date(val as string) : undefined),
    z.date({ required_error: 'Ngày vào làm là bắt buộc' })
  ),
};

// Schema for creating an employee
export const employeeCreateSchema = z
  .object({
    ...employeeBaseSchema,
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
  )
  .refine(
    (data) => {
      // If birthdate and joinDate are provided, ensure joinDate is after birthdate
      if (data.birthdate && data.joinDate) {
        const age = new Date().getFullYear() - data.birthdate.getFullYear();
        const joinAge =
          data.joinDate.getFullYear() - data.birthdate.getFullYear();
        return joinAge >= 16; // Minimum working age
      }
      return true;
    },
    {
      message: 'Nhân viên phải đủ 16 tuổi khi vào làm',
      path: ['joinDate'],
    }
  )
  .refine(
    (data) => {
      // Ensure joinDate is not in the future
      if (data.joinDate) {
        return data.joinDate <= new Date();
      }
      return true;
    },
    {
      message: 'Ngày vào làm không thể trong tương lai',
      path: ['joinDate'],
    }
  );

// Schema for updating an employee
export const employeeUpdateSchema = z
  .object({
    ...employeeBaseSchema,
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
  )
  .refine(
    (data) => {
      // If birthdate and joinDate are provided, ensure joinDate is after birthdate
      if (data.birthdate && data.joinDate) {
        const joinAge =
          data.joinDate.getFullYear() - data.birthdate.getFullYear();
        return joinAge >= 16; // Minimum working age
      }
      return true;
    },
    {
      message: 'Nhân viên phải đủ 16 tuổi khi vào làm',
      path: ['joinDate'],
    }
  )
  .refine(
    (data) => {
      // Ensure joinDate is not in the future
      if (data.joinDate) {
        return data.joinDate <= new Date();
      }
      return true;
    },
    {
      message: 'Ngày vào làm không thể trong tương lai',
      path: ['joinDate'],
    }
  );

// Schema for employee query params
export const employeeQuerySchema = z
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
    position: z.string().optional(),
    department: z.string().optional(),
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
    joinDateFrom: z.preprocess(
      (val) => (val ? new Date(val as string) : undefined),
      z.date().optional()
    ),
    joinDateTo: z.preprocess(
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
      // If both join date ranges are provided, ensure they are valid
      if (data.joinDateFrom && data.joinDateTo) {
        return data.joinDateFrom <= data.joinDateTo;
      }
      return true;
    },
    {
      message: 'Khoảng thời gian vào làm không hợp lệ',
      path: ['joinDateRange'],
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

// Schema for deleting multiple employees
export const employeeBulkDeleteSchema = z.object({
  employeeIds: z
    .array(
      z.string().refine(isValidObjectId, {
        message: 'ID nhân viên không hợp lệ',
      })
    )
    .min(1, 'Cần ít nhất một ID nhân viên'),
});

// Schema for employee ID validation
export const employeeIdSchema = z.object({
  employeeId: z.string().refine(isValidObjectId, {
    message: 'ID nhân viên không hợp lệ',
  }),
});

// Schema for importing employees from file
export const employeeImportSchema = z.object({
  employees: z
    .array(employeeCreateSchema)
    .min(1, 'Cần ít nhất một nhân viên để import'),
});

// Schema for exporting employees
export const employeeExportSchema = z.object({
  employeeIds: z
    .array(
      z.string().refine(isValidObjectId, {
        message: 'ID nhân viên không hợp lệ',
      })
    )
    .optional(), // If not provided, export all employees
  format: z.enum(['excel', 'csv', 'pdf']).default('excel'),
  fields: z.array(z.string()).optional(), // If not provided, export all fields
});

// Schema for bulk updating employee status
export const employeeBulkUpdateStatusSchema = z.object({
  employeeIds: z
    .array(
      z.string().refine(isValidObjectId, {
        message: 'ID nhân viên không hợp lệ',
      })
    )
    .min(1, 'Cần ít nhất một ID nhân viên'),
  status: z.enum(Object.values(USER.STATUS) as [string, ...string[]]),
});

// Schema for bulk updating employee department
export const employeeBulkUpdateDepartmentSchema = z.object({
  employeeIds: z
    .array(
      z.string().refine(isValidObjectId, {
        message: 'ID nhân viên không hợp lệ',
      })
    )
    .min(1, 'Cần ít nhất một ID nhân viên'),
  department: z.string().trim().min(1, 'Phòng ban là bắt buộc'),
});

// Schema for password reset
export const employeePasswordResetSchema = z.object({
  employeeId: z.string().refine(isValidObjectId, {
    message: 'ID nhân viên không hợp lệ',
  }),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
});
