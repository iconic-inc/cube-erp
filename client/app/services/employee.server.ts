import { ISessionUser } from '~/interfaces/auth.interface';
import { fetcher } from '.';
import {
  IEmployee,
  IEmployeeCreate,
  IEmployeeUpdate,
} from '~/interfaces/employee.interface';
import { IListResponse } from '~/interfaces/response.interface';

// Lấy danh sách nhân viên
const getEmployees = async (
  searchParams: URLSearchParams,
  request: ISessionUser,
) => {
  const response = await fetcher(`/employees?${searchParams.toString()}`, {
    request,
  });
  return response as IListResponse<IEmployee>;
};

// Lấy thông tin nhân viên hiện tại theo userId
const getCurrentEmployeeByUserId = async (request: ISessionUser) => {
  const userId = request.user.id;
  const response = await fetcher(`/employees/user/${userId}`, { request });
  return response as IEmployee;
};

// Lấy thông tin một nhân viên
const getEmployeeById = async (id: string, request: ISessionUser) => {
  const response = await fetcher(`/employees/${id}`, { request });
  return response as IEmployee;
};

// Tạo nhân viên mới
const createEmployee = async (data: IEmployeeCreate, request: ISessionUser) => {
  // Đảm bảo dữ liệu được format đúng trước khi gửi đến API
  const formattedData = {
    ...data,
    // Đảm bảo role có giá trị
    role: data.role || '',
  };

  const response = await fetcher('/employees', {
    method: 'POST',
    body: JSON.stringify(formattedData),
    request,
  });
  return response as IEmployee;
};

// Cập nhật thông tin nhân viên
const updateEmployee = async (
  id: string,
  data: IEmployeeUpdate,
  request: ISessionUser,
) => {
  const response = await fetcher(`/employees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    request,
  });
  return response as IEmployee;
};

// Cập nhật thông tin nhân viên hiện tại
const updateMyEmployee = async (
  data: IEmployeeUpdate,
  request: ISessionUser,
) => {
  const userId = request.user.id;
  const response = await fetcher(`/employees/me`, {
    method: 'PUT',
    body: JSON.stringify(data),
    request,
  });
  return response as IEmployee;
};

// Xóa nhân viên
const deleteEmployee = async (id: string, request: ISessionUser) => {
  const response = await fetcher(`/employees/${id}`, {
    method: 'DELETE',
    request,
  });
  return response as { success: boolean };
};

const bulkDeleteEmployees = async (
  employeeIds: string[],
  request: ISessionUser,
) => {
  const response = await fetcher('/employees/bulk', {
    method: 'DELETE',
    body: JSON.stringify({ employeeIds }),
    request,
  });
  return response as { success: boolean; message: string };
};

// Xuất dữ liệu nhân viên
const exportEmployees = async (
  searchParams: URLSearchParams,
  fileType: 'csv' | 'xlsx',
  request: ISessionUser,
) => {
  return await fetcher<{ fileUrl: string; fileName: string; count: number }>(
    `/employees/export/${fileType}?${searchParams.toString()}`,
    {
      method: 'GET',
      request,
    },
  );
};

export {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  updateMyEmployee,
  deleteEmployee,
  bulkDeleteEmployees,
  getCurrentEmployeeByUserId,
  exportEmployees,
};
