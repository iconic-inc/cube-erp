import { AttendanceRequestModel } from '@models/attendanceRequest.model';
import {
  IAttendanceRequest,
  IAttendanceRequestCreate,
} from '../interfaces/attendanceRequest.interface';
import { getEmployeeByUserId } from './employee.service';
import { getReturnData, getReturnList } from '@utils/index';
import { IResponseList } from '../interfaces/response.interface';
import mongoose from 'mongoose';
import { AttendanceModel } from '@models/attendance.model';

const createAttendanceRequest = async (
  userId: string,
  data: IAttendanceRequestCreate
) => {
  const employee = await getEmployeeByUserId(userId);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of today

  const attRequest = await AttendanceRequestModel.build({
    ...data,
    date: today,
    employee: employee.id,
  });

  return getReturnData(attRequest);
};

const attendanceRequestPopulateOptions = {
  path: 'employee',
  select: 'emp_user emp_code emp_position emp_department',
  populate: {
    path: 'emp_user',
    select: 'usr_firstName usr_lastName usr_avatar',
    populate: {
      path: 'usr_avatar',
      select: 'img_url',
    },
  },
};
const getAttendanceRequests = async (employeeId?: string) => {
  const query = employeeId ? { employee: employeeId } : {};
  // Get all attendance requests with populated employee data, sorted by date (newest first)
  const attendanceRequests = await AttendanceRequestModel.find(query)
    .populate(attendanceRequestPopulateOptions)
    .sort({ date: -1 }); // Sort by date descending (newest first)

  return {
    data: getReturnList(attendanceRequests),
    pagination: {
      total: attendanceRequests.length,
      page: 1,
      limit: attendanceRequests.length,
      totalPages: 1,
    },
  } as IResponseList<IAttendanceRequest>;
};

const getAttendanceRequestById = async (id: string) => {
  // Find the attendance request by ID and populate employee data
  const attRequest = await AttendanceRequestModel.findById(id).populate(
    attendanceRequestPopulateOptions
  );
  if (!attRequest) {
    throw new Error('Không tìm thấy yêu cầu chấm công');
  }
  return getReturnData(attRequest);
};

const acceptAttendanceRequest = async (id: string) => {
  const attRequest = await getAttendanceRequestById(id);
  if (!attRequest) {
    throw new Error('Yêu cầu chấm công không tồn tại');
  }

  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const attendance = await AttendanceModel.findOneAndUpdate(
      {
        employee: attRequest.employee?.id,
        date: attRequest.date,
      },
      {
        $set: {
          employee: attRequest.employee?.id,
          date: attRequest.date,
          checkInTime: attRequest.checkInTime,
          checkOutTime: attRequest.checkOutTime,
          fingerprint: attRequest.fingerprint,
          ip: attRequest.ip,
        },
      },
      {
        session,
        new: true,
        upsert: !!attRequest.employee?.id && !attRequest.checkOutTime, // Create new attendance only if check-out time is not set
      }
    );
    if (!attendance) {
      throw new Error('Không thể cập nhật bản ghi chấm công');
    }

    // Update the attendance request status to accepted
    await AttendanceRequestModel.findByIdAndDelete(id, {
      session,
    });

    await session.commitTransaction();
    return getReturnData(attendance);
  } catch (error: any) {
    console.error('Error accepting attendance request:', error);
    if (session) {
      await session.abortTransaction();
    }
  } finally {
    // Ensure the session is ended properly
    if (session) {
      await session.endSession();
    }
  }
};

const rejectAttendanceRequest = async (id: string) => {
  const attRequest = await getAttendanceRequestById(id);
  if (!attRequest) {
    throw new Error('Yêu cầu chấm công không tồn tại');
  }

  // Delete the attendance request
  const deletedRequest = await AttendanceRequestModel.findByIdAndDelete(id);
  if (!deletedRequest) {
    throw new Error('Không thể xóa yêu cầu chấm công');
  }

  return getReturnData(deletedRequest);
};

const getMyAttendanceRequests = async (userId: string) => {
  const employee = await getEmployeeByUserId(userId);

  // Get all attendance requests for the specific employee, sorted by date (newest first)
  const attendanceRequests = await getAttendanceRequests(employee.id);

  return attendanceRequests;
};

export {
  createAttendanceRequest,
  getAttendanceRequests,
  getAttendanceRequestById,
  acceptAttendanceRequest,
  rejectAttendanceRequest,
  getMyAttendanceRequests,
};
