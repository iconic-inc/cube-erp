// client/app/services/attendance.server.ts
import { ISessionUser } from '~/interfaces/auth.interface';
import { fetcher } from '.';
import {
  IAttendanceCreate,
  IAttendance,
  IAttendanceBrief,
} from '~/interfaces/attendance.interface';

// Check-in
const checkIn = async (data: IAttendanceCreate, request: ISessionUser) => {
  const response = await fetcher<IAttendance>(
    '/employees/me/attendance/check-in',
    {
      method: 'POST',
      body: JSON.stringify(data),
      request,
    },
  );
  return response;
};

// Check-in
const checkOut = async (data: IAttendanceCreate, request: ISessionUser) => {
  const response = await fetcher<IAttendance>(
    '/employees/me/attendance/check-out',
    {
      method: 'POST',
      body: JSON.stringify(data),
      request,
    },
  );
  return response;
};

// attendance list for employee
const getAttendancesForEmployee = async (request: ISessionUser) => {
  const response = await fetcher<IAttendanceBrief[]>(
    `/employees/me/attendance/stats`,
    {
      request,
    },
  );
  return response;
};

const getLast7DaysStatsForEmployee = async (request: ISessionUser) => {
  const response = await fetcher<IAttendanceBrief[]>(
    `/employees/me/attendance/stats/week`,
    {
      request,
    },
  );
  return response;
};

const getTodayAttendanceForEmployee = async (request: ISessionUser) => {
  const response = await fetcher<IAttendanceBrief>(
    '/employees/me/attendance/today',
    {
      request,
    },
  );
  return response;
};

const getMonthAttendanceForEmployee = async (
  month: number,
  year: number,
  request: ISessionUser,
) => {
  const response = await fetcher<IAttendanceBrief[]>(
    `/employees/me/attendance/stats?month=${month}&year=${year}`,
    {
      request,
    },
  );
  return response;
};

// Lấy danh sách chấm công
const getAttendances = async (request: ISessionUser) => {
  const response = await fetcher<IAttendanceBrief[]>('/attendance', {
    request,
  });
  return response;
};

const getLast7DaysStats = async (userId: string, request: ISessionUser) => {
  const response = await fetcher<IAttendanceBrief[]>(
    `/attendance/stats/${userId}`,
    {
      request,
    },
  );
  return response;
};

// Lấy thông tin một lần chấm công
const getAttendanceById = async (id: string, request: ISessionUser) => {
  const response = await fetcher<IAttendance>(`/attendance/${id}`, { request });
  return response;
};

// Lấy thống kê chấm công
const getAttendanceStats = async (
  month: number,
  year: number,
  request: ISessionUser,
) => {
  const response = await fetcher<IAttendanceBrief[]>(
    `/attendance/stats?month=${month}&year=${year}`,
    {
      request,
    },
  );
  return response;
};

const getTodayAttendance = async (request: ISessionUser) => {
  const response = await fetcher<IAttendance>('/attendance/today', { request });
  return response;
};

// Lấy mã QR chấm công
const getAttendanceQR = async (request: ISessionUser) => {
  const response = await fetcher<{ qrCode: string; attendanceUrl: string }>(
    '/attendance/qr-code',
    { request },
  );
  return response;
};

const getTodayAttendanceStats = async (request: ISessionUser) => {
  const response = await fetcher<IAttendance[]>('/attendance/stats/today', {
    request,
  });
  return response;
};

const updateAttendance = async (
  id: string,
  data: Partial<IAttendance>,
  request: ISessionUser,
) => {
  const response = await fetcher<IAttendance>(`/attendance/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    request,
  });
  return response;
};

const deleteAttendance = async (id: string, request: ISessionUser) => {
  const response = await fetcher<{ success: boolean }>(`/attendance/${id}`, {
    method: 'DELETE',
    request,
  });
  return response;
};

// Get attendance records for a specific employee by ID
const getAttendancesByEmployeeId = async (
  employeeId: string,
  request: ISessionUser,
) => {
  const response = await fetcher<IAttendance[]>(
    `/attendance/employee/${employeeId}`,
    {
      request,
    },
  );
  return response;
};

export {
  checkIn,
  checkOut,
  getLast7DaysStats,
  getAttendances,
  getAttendanceById,
  getAttendanceStats,
  getAttendanceQR,
  getTodayAttendance,
  getTodayAttendanceStats,
  updateAttendance,
  deleteAttendance,
  getAttendancesForEmployee,
  getLast7DaysStatsForEmployee,
  getTodayAttendanceForEmployee,
  getMonthAttendanceForEmployee,
  getAttendancesByEmployeeId,
};
