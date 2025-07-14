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
import {
  IEmployee,
  IEmployeeCreate,
  IEmployeeDetail,
} from '../interfaces/employee.interface';
import { USER } from '../constants';

// Import modules for export functionality
import { createObjectCsvWriter } from 'csv-writer';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { serverConfig } from '@configs/config.server';

interface IEmployeeQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  position?: string;
  department?: string;
}

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

const getEmployees = async (query: IEmployeeQuery) => {
  const {
    page = 1,
    limit = 10,
    search,
    sortBy,
    sortOrder,
    position,
    department,
  } = query;

  // Build the aggregation pipeline
  const pipeline: any[] = [];

  // Stage 1: Join with the user collection
  pipeline.push({
    $lookup: {
      from: 'users', // The actual collection name in MongoDB
      localField: 'emp_user',
      foreignField: '_id',
      as: 'emp_user',
    },
  });

  // Stage 2: Unwind the emp_user array to make it easier to work with
  pipeline.push({
    $unwind: {
      path: '$emp_user',
      preserveNullAndEmptyArrays: true,
    },
  });

  // Stage 3: Join with avatar collection for user avatar
  pipeline.push({
    $lookup: {
      from: 'images', // Adjust based on your actual image collection name
      localField: 'emp_user.usr_avatar',
      foreignField: '_id',
      as: 'emp_user.usr_avatar',
    },
  });

  // Unwind the avatar (optional, depending on your data structure)
  pipeline.push({
    $unwind: {
      path: '$emp_user.usr_avatar',
      preserveNullAndEmptyArrays: true,
    },
  });

  // Stage 4: Search filter if provided
  if (search) {
    const searchRegex = new RegExp(search, 'i'); // Case-insensitive search
    pipeline.push({
      $match: {
        $or: [
          { 'emp_user.usr_firstName': searchRegex },
          { 'emp_user.usr_lastName': searchRegex },
          { 'emp_user.usr_email': searchRegex },
          { 'emp_user.usr_msisdn': searchRegex },
          { emp_code: searchRegex },
          { emp_position: searchRegex },
          { emp_department: searchRegex },
        ],
      },
    });
  }

  if (position) {
    pipeline.push({
      $match: { emp_position: position },
    });
  }
  if (department) {
    pipeline.push({
      $match: { emp_department: department },
    });
  }

  // Stage 5: Project to exclude sensitive user fields
  pipeline.push({
    $project: {
      _id: 1,
      emp_code: 1,
      emp_position: 1,
      emp_department: 1,
      emp_joinDate: 1,
      createdAt: 1,
      updatedAt: 1,
      emp_user: {
        _id: 1,
        usr_firstName: 1,
        usr_lastName: 1,
        usr_email: 1,
        usr_msisdn: 1,
        usr_address: 1,
        usr_birthdate: 1,
        usr_sex: 1,
        usr_status: 1,
        usr_username: 1,
        usr_slug: 1,
        usr_role: 1,
        usr_avatar: {
          img_url: 1,
          img_name: 1,
        },
      },
    },
  });

  // Stage 6: Sort the results
  const sortField = sortBy || 'createdAt';
  const sortDirection = sortOrder === 'asc' ? 1 : -1;
  pipeline.push({
    $sort: { [sortField]: sortDirection },
  });

  // Get total count first (for pagination)
  const countPipeline = [...pipeline]; // Clone the pipeline
  countPipeline.push({ $count: 'total' });
  const countResult = await EmployeeModel.aggregate(countPipeline);
  const total = countResult.length > 0 ? countResult[0].total : 0;

  // Stage 7: Apply pagination
  pipeline.push({ $skip: (page - 1) * limit });
  pipeline.push({ $limit: +limit });

  // Execute the aggregation
  const employees = await EmployeeModel.aggregate(pipeline);
  const totalPages = Math.ceil(total / limit);

  return {
    data: getReturnList<IEmployeeDetail>(employees),
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  };
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

  return getReturnData(employee as any) as Required<IEmployeeDetail>;
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
        _id: { $ne: employee.emp_user.toString() },
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

    const employeeUpdateData = formatAttributeName(
      removeNestedNullish<IEmployeeCreate>(
        getReturnData(data, {
          fields: ['code', 'position', 'department', 'joinDate'],
        })
      ),
      USER.EMPLOYEE.PREFIX
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
        employee.emp_user.toString(),
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
    return getReturnData(
      await finalEmployee.populate('emp_user', '-__v -usr_password -usr_salt')
    );
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

const bulkDeleteEmployees = async (employeeIds: string[]) => {
  if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
    throw new BadRequestError('Invalid employee IDs');
  }
  let session;
  try {
    // Bắt đầu transaction
    session = await mongoose.startSession();
    session.startTransaction();

    // Tìm tất cả employees để lấy emp_user
    const employees = await EmployeeModel.find({
      _id: { $in: employeeIds },
    }).select('emp_user');
    if (employees.length === 0) {
      throw new NotFoundError('No employees found for the provided IDs');
    }
    // Lấy danh sách emp_user từ employees
    const empUserIds = employees.map((emp) => emp.emp_user.toString());
    // Xóa tất cả employees
    const deleteEmployeesResult = await EmployeeModel.deleteMany(
      { _id: { $in: employeeIds } },
      { session }
    );
    if (deleteEmployeesResult.deletedCount === 0) {
      throw new Error('Failed to delete employees');
    }
    // Xóa tất cả users tương ứng
    const deleteUsersResult = await UserModel.deleteMany(
      { _id: { $in: empUserIds } },
      { session }
    );
    if (deleteUsersResult.deletedCount === 0) {
      throw new Error('Failed to delete users');
    }
    // Commit transaction
    await session.commitTransaction();
    return {
      success: true,
      message: `Successfully deleted ${deleteEmployeesResult.deletedCount} employees and their associated users.`,
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
const exportEmployeesToCSV = async (queryParams: IEmployeeQuery) => {
  try {
    // Reuse the same query logic from getEmployees
    const { data: employeesList } = await getEmployees(queryParams);

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
    const csvData = employeesList.map((employee) => {
      return {
        'Mã nhân viên': employee.emp_code || '',
        Tên: employee.emp_user?.usr_firstName || '',
        Họ: employee.emp_user?.usr_lastName || '',
        'Vị trí': employee.emp_position || '',
        'Phòng ban': employee.emp_department || '',
        Email: employee.emp_user?.usr_email || '',
        'Số điện thoại': employee.emp_user?.usr_msisdn || '',
        'Ngày vào làm': employee.emp_joinDate
          ? new Date(employee.emp_joinDate).toISOString().split('T')[0]
          : '',
        'Trạng thái': employee.emp_user?.usr_status || '',
        'Tạo lúc': employee.createdAt
          ? new Date(employee.createdAt).toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
          : '',
        'Cập nhật lúc': employee.updatedAt
          ? new Date(employee.updatedAt).toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
          : '',
      };
    });

    // Write data to CSV file
    await csvWriter.writeRecords(csvData);

    return {
      fileUrl: `${serverConfig.serverUrl}/exports/employees_${timestamp}.csv`,
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
    const { data: employeesList } = await getEmployees(queryParams);

    // Create directory if it doesn't exist
    const exportDir = path.join(process.cwd(), 'public', 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    } else {
      for (const file of fs.readdirSync(exportDir)) {
        if (file.startsWith('nhan_su_') && file.endsWith('.xlsx')) {
          fs.unlinkSync(path.join(exportDir, file));
        }
      }
    }

    // Create timestamp for unique filename
    const timestamp = new Date().getTime();
    const fileName = `nhan_su_${new Date()
      .toLocaleDateString('vi-VN')
      .split('/')
      .join('-')}_${timestamp}.xlsx`;
    const filePath = path.join(exportDir, fileName);

    // Map employee data for Excel
    const excelData = employeesList.map((employee) => {
      return {
        'Mã nhân viên': employee.emp_code || '',
        Tên: employee.emp_user?.usr_firstName || '',
        Họ: employee.emp_user?.usr_lastName || '',
        'Vị trí': employee.emp_position || '',
        'Phòng ban': employee.emp_department || '',
        Email: employee.emp_user?.usr_email || '',
        'Số điện thoại': employee.emp_user?.usr_msisdn || '',
        'Ngày vào làm': employee.emp_joinDate
          ? new Date(employee.emp_joinDate).toISOString().split('T')[0]
          : '',
        'Trạng thái': employee.emp_user?.usr_status || '',
        'Tạo lúc': employee.createdAt
          ? new Date(employee.createdAt).toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
          : '',
        'Cập nhật lúc': employee.updatedAt
          ? new Date(employee.updatedAt).toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
          : '',
      };
    });

    // Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Nhân viên');

    // Write to file
    XLSX.writeFile(workbook, filePath);

    return {
      fileUrl: `${serverConfig.serverUrl}/exports/${fileName}`,
      fileName: fileName,
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
  bulkDeleteEmployees,
  getEmployeeByUserId,
  getCurrentEmployeeByUserId,
  exportEmployeesToCSV,
  exportEmployeesToXLSX,
};
