// client/app/services/attendanceRequest.server.ts
import { ISessionUser } from '~/interfaces/auth.interface';
import { fetcher } from '.';
import { IListResponse } from '~/interfaces/response.interface';
import {
  IAttendanceRequestCreate,
  IAttendanceRequest,
  IAttendanceRequestBrief,
} from '~/interfaces/attendanceRequest.interface';

// Create attendance request
const createAttendanceRequest = async (
  data: IAttendanceRequestCreate,
  request: ISessionUser,
) => {
  const response = await fetcher<IAttendanceRequest>(
    '/employees/me/attendance-requests',
    {
      method: 'POST',
      body: JSON.stringify(data),
      request,
    },
  );
  return response;
};

// Get all attendance requests (admin view)
const getAttendanceRequests = async (request: ISessionUser) => {
  const response = await fetcher<IListResponse<IAttendanceRequestBrief>>(
    '/attendance-requests',
    {
      request,
    },
  );
  return response;
};

// Get attendance requests for a specific employee (admin view)
const getAttendanceRequestsByEmployeeId = async (
  employeeId: string,
  request: ISessionUser,
) => {
  const response = await fetcher<IAttendanceRequestBrief[]>(
    `/attendance-requests/employee/${employeeId}`,
    {
      request,
    },
  );
  return response;
};

// Get attendance request by ID (admin view)
const getAttendanceRequestById = async (
  requestId: string,
  request: ISessionUser,
) => {
  const response = await fetcher<IAttendanceRequest>(
    `/attendance-requests/${requestId}`,
    {
      request,
    },
  );
  return response;
};

// Get my attendance requests (employee view)
const getMyAttendanceRequests = async (request: ISessionUser) => {
  const response = await fetcher<IListResponse<IAttendanceRequestBrief>>(
    '/employees/me/attendance-requests',
    {
      request,
    },
  );
  return response;
};

// Get my attendance request by ID (employee view)
const getMyAttendanceRequestById = async (
  requestId: string,
  request: ISessionUser,
) => {
  const response = await fetcher<IAttendanceRequest>(
    `/employees/me/attendance-requests/${requestId}`,
    {
      request,
    },
  );
  return response;
};

// Accept attendance request (admin action)
const acceptAttendanceRequest = async (
  requestId: string,
  request: ISessionUser,
) => {
  const response = await fetcher<IAttendanceRequest>(
    `/attendance-requests/${requestId}/accept`,
    {
      method: 'PUT',
      request,
    },
  );
  return response;
};

// Reject attendance request (admin action)
const rejectAttendanceRequest = async (
  attendanceId: string,
  request: ISessionUser,
) => {
  const response = await fetcher<{ success: boolean }>(
    `/attendance-requests/${attendanceId}/reject`,
    {
      method: 'PUT',
      request,
    },
  );
  return response;
};

export {
  createAttendanceRequest,
  getAttendanceRequests,
  getAttendanceRequestsByEmployeeId,
  getAttendanceRequestById,
  getMyAttendanceRequests,
  getMyAttendanceRequestById,
  acceptAttendanceRequest,
  rejectAttendanceRequest,
};
