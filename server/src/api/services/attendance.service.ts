import QRCode from 'qrcode';
import { Types } from 'mongoose';
import { AttendanceModel } from '../models/attendance.model';
import { getReturnData, getReturnList } from '@utils/index';
import { BadRequestError } from '../core/errors';
import { createAttendanceNotification } from './notification.service';
import {
  ICheckInData,
  IAttendanceQRResponse,
} from '../interfaces/attendance.interface';
import { serverConfig } from '@configs/config.server';
import { getEmployeeById, getEmployeeByUserId } from './employee.service';
import { getAllOfficeIPAddresses } from './officeIP.service';

const generateAttendanceQR = async (): Promise<IAttendanceQRResponse> => {
  try {
    const qrCode = await QRCode.toDataURL(serverConfig.attendanceUrl, {
      errorCorrectionLevel: 'H',
    });
    return {
      qrCode,
      attendanceUrl: serverConfig.attendanceUrl,
    };
  } catch (error) {
    throw new BadRequestError('Failed to generate QR code');
  }
};

const checkIn = async (data: ICheckInData) => {
  console.log('Processing check-in for user:', data.userId);

  // Validate input data
  // if (!data.fingerprint) {
  //   throw new BadRequestError('Fingerprint is required');
  // }

  if (!data.ip) {
    throw new BadRequestError('Không tìm thấy địa chỉ IP. Vui lòng thử lại.');
  }

  const officeIPs = await getAllOfficeIPAddresses();
  const ipAddresses = officeIPs.map((ip) => ip.ipAddress);

  if (!ipAddresses.includes(data.ip)) {
    throw new BadRequestError('Vui lòng sử dụng wifi công ty để chấm công.');
  }

  const employee = await getEmployeeByUserId(data.userId);
  // const foundAttendance = await AttendanceModel.findOne({
  // employee: employee.id,
  // });
  // if (foundAttendance && foundAttendance.fingerprint !== data.fingerprint) {
  //   throw new BadRequestError(
  //     'Please use the same browser as the one you used to check in the first time. If still not working, please contact the admin.'
  //   );
  // }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of today

  const attendance = await AttendanceModel.build({
    employee: employee.id,
    fingerprint: data.fingerprint,
    ip: data.ip,
    checkInTime: now,
    date: today,
  });

  // Kiểm tra thời gian check-in và gửi thông báo phù hợp
  const hour = now.getHours();
  const status = hour < 9 ? 'success' : 'late';

  console.log('Creating notification with status:', status);

  // Tạo thông báo - truyền null cho senderId hoặc sử dụng system user ID nếu có
  await createAttendanceNotification(data.userId, now, status);
  console.log('Notification created successfully');

  return getReturnData(attendance);
};

const checkOut = async (data: ICheckInData) => {
  console.log('Processing check-out for user:', data.userId);

  // Validate input data
  if (!data.fingerprint) {
    throw new BadRequestError('Fingerprint is required');
  }

  if (!data.ip) {
    throw new BadRequestError('IP address is required');
  }

  const officeIPs = await getAllOfficeIPAddresses();
  const ipAddresses = officeIPs.map((ip) => ip.ipAddress);

  if (!ipAddresses.includes(data.ip)) {
    throw new BadRequestError('Hãy sử dụng wifi công ty để chấm công.');
  }

  const employee = await getEmployeeByUserId(data.userId);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of today
  console.log('Updating attendance record...');

  const attendance = await AttendanceModel.findOneAndUpdate(
    {
      employee: employee.id,
      // fingerprint: data.fingerprint,
      date: today,
    },
    {
      checkOutTime: now,
    },
    {
      new: true,
    }
  );
  if (!attendance) {
    throw new BadRequestError(
      'Không tìm thấy bản ghi chấm công. Vui lòng điểm danh trước hoặc sử dụng đúng trình duyệt đã điểm danh trước đó.'
    );
  }

  console.log('Attendance record updated:', attendance);

  // Kiểm tra thời gian check-out và gửi thông báo phù hợp
  const hour = now.getHours();
  const status = hour > 17 ? 'success' : 'early';

  console.log('Creating notification with status:', status);

  // Tạo thông báo - truyền null cho senderId hoặc sử dụng system user ID nếu có
  await createAttendanceNotification(data.userId, now, status);
  console.log('Notification created successfully');

  return getReturnData(attendance);
};

// Thống kê chấm công
const getAttendanceStats = async (month: number, year: number) => {
  const stats = await AttendanceModel.aggregate([
    {
      $match: {
        date: {
          $gte: new Date(year, month - 1, 1),
          $lte: new Date(year, month, 0),
        },
      },
    },
    {
      $group: {
        _id: '$ employee',
        totalDays: { $sum: 1 },
        lateCount: {
          $sum: {
            $cond: [{ $gt: ['$checkInTime', '$scheduledTime'] }, 1, 0],
          },
        },
      },
    },
  ]);
  return getReturnList(stats);
};

const getLast7DaysStats = async (userId: string) => {
  const now = new Date();
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago without mutating original date

  const employee = await getEmployeeByUserId(userId);

  const attendance = await AttendanceModel.find({
    employee: employee.id,
    date: { $gte: last7Days.setHours(0, 0, 0, 0) },
  });
  return getReturnList(attendance);
};

// get today's attendance record
const getTodayAttendance = async (userId: string) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of today without mutating original date
  const employee = await getEmployeeByUserId(userId);

  const attendance = await AttendanceModel.findOne({
    employee: employee.id,
    date: today,
  });
  return getReturnData(attendance) || {};
};

const getTodayAttendanceStats = async () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of today without mutating original date

  const attendance = await AttendanceModel.find({
    date: today,
  }).populate({
    path: 'employee',
    select: 'emp_user emp_code',
    populate: {
      path: 'emp_user',
      select: 'usr_firstName usr_lastName usr_avatar',
      populate: {
        path: 'usr_avatar',
        select: 'img_url',
      },
    },
  });

  return getReturnList(attendance);
};

const updateAttendance = async (id: string, data: any) => {
  const attendance = await AttendanceModel.findByIdAndUpdate(
    id,
    {
      $set: data,
    },
    { new: true }
  );
  if (!attendance) {
    throw new BadRequestError('Không tìm thấy bản ghi chấm công');
  }
  return getReturnData(attendance);
};

// Xóa bản ghi chấm công
const deleteAttendance = async (id: string) => {
  const attendance = await AttendanceModel.findByIdAndDelete(id);
  if (!attendance) {
    throw new BadRequestError('Không tìm thấy bản ghi chấm công');
  }
  return getReturnData(attendance);
};

// // Xuất báo cáo
// const exportAttendanceReport = async (month: number, year: number) => {
//   const data = await getAttendanceStats(month, year);
//   // Tạo file Excel/PDF
//   return generateReport(data);
// };

// Get all attendance records for a specific employee
const getEmployeeAttendances = async (employeeId: string) => {
  // Validate employee ID
  if (!employeeId || !Types.ObjectId.isValid(employeeId)) {
    throw new BadRequestError('Invalid employee ID');
  }

  // Verify employee exists
  const employee = await getEmployeeById(employeeId);
  if (!employee) {
    throw new BadRequestError('Employee not found');
  }

  // Get all attendance records for the employee, sorted by date (newest first)
  const attendances = await AttendanceModel.find({
    employee: employeeId,
  })
    .populate({
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
    })
    .sort({ date: -1 }); // Sort by date descending (newest first)

  return getReturnList(attendances);
};

export {
  generateAttendanceQR,
  checkIn,
  checkOut,
  getAttendanceStats,
  getLast7DaysStats,
  getTodayAttendance,
  getTodayAttendanceStats,
  updateAttendance,
  deleteAttendance,
  getEmployeeAttendances,
};
