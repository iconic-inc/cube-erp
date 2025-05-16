import {
  formatAttributeName,
  getReturnData,
  getReturnList,
  removeNestedNullish,
} from '@utils/index';
import { NotFoundError, BadRequestError } from '../core/errors';
import { IUserAttrs, IUserDetail } from '../interfaces/user.interface';
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

const updateUser = async (userId: string, user: IUserAttrs) => {
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

export { changePassword, updateUser, getCurrentUser, getUsers, getUserById };
