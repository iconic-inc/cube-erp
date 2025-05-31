import bcrypt from 'bcrypt';
import mongoose, { isValidObjectId } from 'mongoose';

import { EmployeeModel } from '../models/employee.model';
import { BadRequestError, NotFoundError } from '../core/errors';
import {
  formatAttributeName,
  getReturnData,
  getReturnList,
  isEmptyObj,
  removeNestedNullish,
} from '@utils/index';
import { UserModel } from '../models/user.model';
import { IEmployeeCreate } from '../interfaces/employee.interface';
import { USER } from '../constants';

// Import modules for export functionality
import { createObjectCsvWriter } from 'csv-writer';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const createEmployee = async (data: IEmployeeCreate) => {
  let session;
  try {
    // Kiểm tra trước khi bắt đầu transaction
    const [existingEmployeeCheck, existingUserCheck] = await Promise.all([
      EmployeeModel.findOne({ emp_code: data.code }),
      UserModel.findOne({
        $or: [{ usr_email: data.email }, { usr_username: data.username }],
      }),
    ]);

    if (existingEmployeeCheck) {
      throw new BadRequestError('Employee code already exists');
    }

    if (existingUserCheck) {
      throw new BadRequestError(
        'Tên đăng nhập hoặc email đã tồn tại trong hệ thống'
      );
    }

    // Kiểm tra ràng buộc role nếu có trường role
    if (!data.role || !isValidObjectId(data.role) || !data.password) {
      throw new BadRequestError('Bad data');
    }

    // Bắt đầu transaction
    session = await mongoose.startSession();
    session.startTransaction();

    // Tạo user mới
    const salt = bcrypt.genSaltSync(10);
    const hashPassword = await bcrypt.hash(data.password, salt);

    const userData = {
      usr_firstName: data.firstName,
      usr_lastName: data.lastName,
      usr_email: data.email,
      usr_msisdn: data.msisdn,
      usr_address: data.address,
      usr_birthdate: data.birthdate,
      usr_sex: data.sex,
      usr_username: data.username || data.email,
      usr_slug: data.email.split('@')[0],
      usr_role: data.role,
      usr_password: hashPassword,
      usr_salt: salt,
    };

    const [newUser] = await UserModel.create([userData], { session });

    // Tạo employee mới
    const [newEmployee] = await EmployeeModel.create(
      [
        formatAttributeName(
          {
            user: newUser._id,
            code: data.code,
            position: data.position,
            department: data.department,
            joinDate: data.joinDate,
          },
          USER.EMPLOYEE.PREFIX
        ),
      ],
      { session }
    );

    // Commit transaction
    await session.commitTransaction();
    session = null;

    return {
      ...getReturnData(newEmployee.toJSON(), { without: ['emp_user'] }),
      emp_user: getReturnData(newUser.toJSON(), {
        without: ['_id', 'usr_password', 'usr_salt'],
      }),
    };
  } catch (error) {
    // Rollback transaction nếu có lỗi
    if (session) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        console.error('Error aborting transaction:', abortError);
      }
    }
    throw error;
  }
};

const getEmployees = async (query: any = {}) => {
  const employees = await EmployeeModel.find(query)
    .populate({
      path: 'emp_user',
      select: '-__v -usr_password -usr_salt',
      populate: {
        path: 'usr_avatar',
      },
    })
    .sort({ createdAt: -1 });

  return getReturnList(employees);
};

const getEmployeeById = async (id: string) => {
  const employee = await EmployeeModel.findById(id).populate({
    path: 'emp_user',
    select: '-usr_password -usr_salt -__v',
    populate: {
      path: 'usr_role usr_avatar',
      select: 'name slug img_url',
    },
  });

  if (!employee) {
    throw new NotFoundError('Employee not found');
  }

  return getReturnData(employee);
};

const getEmployeeByUserId = async (emp_user: string) => {
  const employee = await EmployeeModel.findOne({ emp_user }).populate({
    path: 'emp_user',
    select: '-__v -usr_password -usr_salt',
    populate: {
      path: 'usr_role usr_avatar',
      select: 'name slug img_url',
    },
  });

  if (!employee) {
    throw new NotFoundError('Employee not found');
  }

  return getReturnData(employee);
};

const getCurrentEmployeeByUserId = async (emp_user: string) => {
  const employee = await EmployeeModel.findOne({ emp_user }).populate({
    path: 'emp_user',
    select: '-__v -usr_password -usr_salt',
    populate: {
      path: 'usr_role usr_avatar',
      select: 'name slug img_url',
    },
  });

  if (!employee) {
    throw new NotFoundError('Employee not found');
  }

  return getReturnData(employee);
};

const updateEmployee = async (id: string, data: Partial<IEmployeeCreate>) => {
  let session;
  try {
    // Tìm employee và lấy emp_user
    const employee = await EmployeeModel.findById(id);

    if (!employee) {
      throw new NotFoundError('Employee not found');
    }

    // Kiểm tra trùng lặp mã nhân viên
    if (data.code) {
      const existingEmployee = await EmployeeModel.findOne({
        _id: { $ne: id },
        code: data.code,
      });

      if (existingEmployee) {
        throw new BadRequestError('Mã nhân viên đã tồn tại trong hệ thống');
      }
    }

    // Kiểm tra trùng lặp email nếu có cập nhật email
    if (data.email) {
      const existingUser = await UserModel.findOne({
        _id: { $ne: employee.emp_user.id },
        usr_email: data.email,
      });

      if (existingUser) {
        throw new BadRequestError('Email đã tồn tại trong hệ thống');
      }
    }

    // Kiểm tra ràng buộc role nếu có cập nhật role
    if (data.role && !isValidObjectId(data.role)) {
      throw new BadRequestError('Quyền không hợp lệ');
    }

    // Bắt đầu transaction
    session = await mongoose.startSession();
    session.startTransaction();

    const employeeUpdateData = removeNestedNullish<IEmployeeCreate>(
      getReturnData(data, {
        fields: ['code', 'position', 'department', 'joinDate'],
      })
    );

    // Cập nhật employee nếu có dữ liệu cần cập nhật
    if (!isEmptyObj(employeeUpdateData)) {
      const updatedEmployee = await EmployeeModel.findByIdAndUpdate(
        id,
        { $set: employeeUpdateData },
        { new: true, session }
      );

      if (!updatedEmployee) {
        throw new NotFoundError('Nhân viên không tồn tại');
      }
    }

    const userUpdateData = removeNestedNullish<Partial<IEmployeeCreate>>(
      getReturnData(data, {
        fields: [
          'firstName',
          'lastName',
          'email',
          'msisdn',
          'avatar',
          'address',
          'username',
          'birthdate',
          'sex',
          'status',
          'role',
        ],
      })
    );

    if (data.password) {
      const salt = bcrypt.genSaltSync(10);
      const hashPassword = await bcrypt.hash(data.password, salt);

      userUpdateData.password = hashPassword;
      // @ts-ignore
      userUpdateData.salt = salt;
    }

    if (!isEmptyObj(userUpdateData)) {
      const updatedUser = await UserModel.findByIdAndUpdate(
        employee.emp_user.id,
        {
          $set: {
            ...formatAttributeName(userUpdateData, USER.PREFIX),
            ...(data.email && {
              usr_slug: data.email.split('@')[0],
            }),
          },
        },
        { new: true, session }
      );

      if (!updatedUser) {
        throw new NotFoundError('User not found');
      }
    }

    // Commit transaction
    await session.commitTransaction();
    session = null;

    // Lấy dữ liệu mới nhất sau khi cập nhật
    const finalEmployee = await EmployeeModel.findById(id).populate({
      path: 'emp_user',
      select: '-__v -usr_password -usr_salt',
    });

    if (!finalEmployee) {
      throw new NotFoundError('Nhân viên không tồn tại');
    }

    return {
      ...getReturnData(finalEmployee, { without: ['emp_user'] }),
      emp_user: getReturnData(finalEmployee.emp_user.id),
    };
  } catch (error) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        console.error('Error aborting transaction:', abortError);
      }
    }
    throw error;
  } finally {
    if (session) {
      try {
        await session.endSession();
      } catch (endError) {
        console.error('Error ending session:', endError);
      }
    }
  }
};

const deleteEmployee = async (id: string) => {
  let session;
  try {
    // Tìm employee để lấy emp_user
    const employee = await EmployeeModel.findById(id);

    if (!employee) {
      throw new NotFoundError('Employee not found');
    }

    // Bắt đầu transaction
    session = await mongoose.startSession();
    session.startTransaction();

    // Xóa employee
    const deleteEmployeeResult = await EmployeeModel.deleteOne(
      { _id: id },
      { session }
    );

    if (deleteEmployeeResult.deletedCount === 0) {
      throw new Error('Failed to delete employee');
    }

    // Xóa user tương ứng
    const deleteUserResult = await UserModel.deleteOne(
      { _id: employee.emp_user.id },
      { session }
    );

    if (deleteUserResult.deletedCount === 0) {
      throw new Error('Failed to delete user');
    }

    // Commit transaction
    await session.commitTransaction();

    return {
      success: true,
      message:
        'Employee and associated user data have been deleted successfully',
    };
  } catch (error) {
    // Rollback transaction nếu có lỗi
    if (session) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        console.error('Error aborting transaction:', abortError);
      }
    }
    throw error;
  } finally {
    // Đảm bảo session luôn được kết thúc
    if (session) {
      try {
        await session.endSession();
      } catch (endError) {
        console.error('Error ending session:', endError);
      }
    }
  }
};

/**
 * Export employees data to CSV file
 * @param queryParams Query parameters for filtering employees
 */
const exportEmployeesToCSV = async (queryParams: any) => {
  try {
    // Reuse the same query logic from getEmployees
    const employeesList = await getEmployees(queryParams);

    // Create directory if it doesn't exist
    const exportDir = path.join(process.cwd(), 'public', 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // Create timestamp for unique filename
    const timestamp = new Date().getTime();
    const filePath = path.join(exportDir, `employees_${timestamp}.csv`);

    // Define CSV headers based on employee data structure
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'code', title: 'Employee Code' },
        { id: 'firstName', title: 'First Name' },
        { id: 'lastName', title: 'Last Name' },
        { id: 'position', title: 'Position' },
        { id: 'department', title: 'Department' },
        { id: 'email', title: 'Email' },
        { id: 'phone', title: 'Phone' },
        { id: 'joinDate', title: 'Join Date' },
        { id: 'status', title: 'Status' },
        { id: 'createdAt', title: 'Created At' },
        { id: 'updatedAt', title: 'Updated At' },
      ],
    });

    // Map employee data to CSV format
    const csvData = employeesList.map((employee: any) => {
      return {
        code: employee.code || '',
        firstName: employee.emp_user.id?.usr_firstName || '',
        lastName: employee.emp_user.id?.usr_lastName || '',
        position: employee.position || '',
        department: employee.department || '',
        email: employee.emp_user.id?.usr_email || '',
        phone: employee.emp_user.id?.usr_msisdn || '',
        joinDate: employee.joinDate
          ? new Date(employee.joinDate).toISOString().split('T')[0]
          : '',
        status: employee.emp_user.id?.usr_status || '',
        createdAt: employee.createdAt
          ? new Date(employee.createdAt).toISOString()
          : '',
        updatedAt: employee.updatedAt
          ? new Date(employee.updatedAt).toISOString()
          : '',
      };
    });

    // Write data to CSV file
    await csvWriter.writeRecords(csvData);

    return {
      filePath: `/exports/employees_${timestamp}.csv`,
      fileName: `employees_${timestamp}.csv`,
      count: csvData.length,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Export employees data to XLSX file
 * @param queryParams Query parameters for filtering employees
 */
const exportEmployeesToXLSX = async (queryParams: any) => {
  try {
    // Reuse the same query logic from getEmployees
    const employeesList = await getEmployees(queryParams);

    // Create directory if it doesn't exist
    const exportDir = path.join(process.cwd(), 'public', 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // Create timestamp for unique filename
    const timestamp = new Date().getTime();
    const filePath = path.join(exportDir, `employees_${timestamp}.xlsx`);

    // Map employee data for Excel
    const excelData = employeesList.map((employee: any) => {
      return {
        'Employee Code': employee.code || '',
        'First Name': employee.emp_user.id?.usr_firstName || '',
        'Last Name': employee.emp_user.id?.usr_lastName || '',
        Position: employee.position || '',
        Department: employee.department || '',
        Email: employee.emp_user.id?.usr_email || '',
        Phone: employee.emp_user.id?.usr_msisdn || '',
        'Join Date': employee.joinDate
          ? new Date(employee.joinDate).toISOString().split('T')[0]
          : '',
        Status: employee.emp_user.id?.usr_status || '',
        'Created At': employee.createdAt
          ? new Date(employee.createdAt).toISOString()
          : '',
        'Updated At': employee.updatedAt
          ? new Date(employee.updatedAt).toISOString()
          : '',
      };
    });

    // Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

    // Write to file
    XLSX.writeFile(workbook, filePath);

    return {
      filePath: `/exports/employees_${timestamp}.xlsx`,
      fileName: `employees_${timestamp}.xlsx`,
      count: excelData.length,
    };
  } catch (error) {
    throw error;
  }
};

export {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getEmployeeByUserId,
  getCurrentEmployeeByUserId,
  exportEmployeesToCSV,
  exportEmployeesToXLSX,
};
