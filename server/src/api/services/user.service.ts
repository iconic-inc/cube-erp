import {
  formatAttributeName,
  getReturnData,
  getReturnList,
  removeNestedNullish,
} from '@utils/index';
import {
  NotFoundError,
  BadRequestError,
  InternalServerError,
} from '../core/errors';
import { IUserCreate, IUserDetail } from '../interfaces/user.interface';
import { UserModel } from '../models/user.model';
import bcrypt from 'bcrypt';
import { USER } from '../constants';

const getUsers = async (query: any = {}) => {
  // Loại bỏ các trường nhạy cảm khi trả về danh sách users
  const users = await UserModel.find(query, [
    '-usr_password',
    '-usr_salt',
    '-__v',
  ])
    .sort({ createdAt: -1 })
    .populate('usr_role', '-__v -grants')
    .populate('usr_avatar', '-__v');

  return getReturnList(users);
};

const changePassword = async (userId: string, password: string) => {
  if (!password) throw new NotFoundError('Password not provided');

  const foundUser = await UserModel.findOne({ _id: userId });
  if (!foundUser) {
    throw new NotFoundError('User not found');
  }

  const user = await UserModel.findOneAndUpdate(
    { _id: userId },
    {
      usr_password: await bcrypt.hash(password, foundUser.usr_salt),
    },
    {
      new: true,
      projection: { usr_password: 0, usr_salt: 0, usr_role: 0, __v: 0 },
    }
  )
    .populate('usr_role', '-__v -grants')
    .populate('usr_avatar', '-__v');

  if (!user) throw new NotFoundError('User not found');

  return getReturnData(user);
};

const updateUser = async (userId: string, user: IUserCreate) => {
  if (user.password) {
    await changePassword(userId, user.password);
    delete user.password;
  }

  const foundUser = await UserModel.findOneAndUpdate(
    { _id: userId },
    removeNestedNullish(formatAttributeName(user, USER.PREFIX)),
    {
      new: true,
      projection: { usr_password: 0, usr_salt: 0, usr_role: 0, __v: 0 },
    }
  )
    .populate('usr_role', '-__v -grants')
    .populate('usr_avatar', '-__v');

  if (!foundUser) throw new NotFoundError('foundUser not found');

  return getReturnData(user);
};

const getCurrentUser = async (userId: string) => {
  const user = await UserModel.findById(userId, [
    '-usr_password',
    '-usr_salt',
    '-__v',
  ])
    .populate('usr_role', '-__v -grants')
    .populate('usr_avatar', '-__v');

  if (!user) throw new NotFoundError('User not found');

  return getReturnData(user);
};

const getUserById = async (userId: string) => {
  const user = await UserModel.findById(userId)
    .populate({
      path: 'usr_role',
      select: 'name slug status description grants',
    })
    .populate('usr_avatar', '-__v');

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return getReturnData<IUserDetail>(user as unknown as IUserDetail);
};

const createEmployee = async (employeeData: IUserCreate) => {
  // Validate required fields
  if (!employeeData.email) throw new BadRequestError('Email is required');
  if (!employeeData.firstName)
    throw new BadRequestError('First name is required');

  // Check if user already exists with this email
  const existingUser = await UserModel.findOne({
    usr_email: employeeData.email,
  });
  if (existingUser) {
    throw new BadRequestError('Email already exists');
  }

  // Generate salt and password for the new employee
  const salt = bcrypt.genSaltSync(10);
  // Generate a random temporary password
  const tempPassword = Math.random().toString(36).slice(-8);
  const hashPassword = await bcrypt.hash(tempPassword, salt);

  // Set username if not provided (use email by default)
  if (!employeeData.username) {
    employeeData.username = employeeData.email;
  }

  // Set slug if not provided
  if (!employeeData.slug) {
    employeeData.slug = employeeData.firstName
      .toLowerCase()
      .replace(/\s+/g, '-');
  }

  // Set status to active by default
  if (!employeeData.status) {
    employeeData.status = USER.STATUS.ACTIVE;
  }

  // Create the employee
  const newEmployee = await UserModel.build({
    ...employeeData,
    password: hashPassword,
    salt: salt,
  });

  if (!newEmployee) {
    throw new InternalServerError('Failed to create employee');
  }

  // Return employee data without sensitive information
  return getReturnData(newEmployee);
};

const deleteEmployee = async (userId: string) => {
  if (!userId) throw new BadRequestError('User ID is required');

  // Find the user first to confirm it exists
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new NotFoundError('Employee not found');
  }

  // Option 1: Soft delete - Update status to 'deleted'
  const deletedUser = await UserModel.findByIdAndUpdate(
    userId,
    { usr_status: USER.STATUS.DELETED },
    { new: true }
  );

  // Option 2: Hard delete (uncomment if you want to permanently delete)
  // const deletedUser = await UserModel.findByIdAndDelete(userId);

  if (!deletedUser) {
    throw new InternalServerError('Failed to delete employee');
  }

  return { success: true, id: userId };
};

export {
  changePassword,
  updateUser,
  getCurrentUser,
  getUsers,
  getUserById,
  createEmployee,
  deleteEmployee,
};
