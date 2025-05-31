import { ISessionUser } from '~/interfaces/auth.interface';
import { fetcher } from '.';
import {
  IEmployee,
  IEmployeeCreate,
  IEmployeeUpdate,
} from '~/interfaces/employee.interface';

// Lấy danh sách nhân viên
const getEmployees = async (request: ISessionUser) => {
  const response = await fetcher('/employees', { request });
  return response as IEmployee[];
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
  try {
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
  } catch (error: any) {
    console.error('Error in createEmployee:', error);

    // Xử lý lỗi từ API
    if (error instanceof SyntaxError || error.message?.includes('JSON')) {
      // Lỗi parse JSON
      console.error('Invalid JSON response from server');
      throw new Error('Lỗi từ server: Phản hồi không hợp lệ');
    } else if (error.status === 400) {
      // Lỗi validation
      try {
        const errorData = await error.json();
        throw new Error(errorData.message || 'Dữ liệu không hợp lệ');
      } catch (jsonError) {
        console.error('Failed to parse error response:', jsonError);
        throw new Error('Dữ liệu không hợp lệ');
      }
    } else if (error.status === 409) {
      // Lỗi trùng lặp
      try {
        const errorData = await error.json();
        throw new Error(errorData.message || 'Dữ liệu đã tồn tại');
      } catch (jsonError) {
        console.error('Failed to parse error response:', jsonError);
        throw new Error('Dữ liệu đã tồn tại');
      }
    } else {
      // Lỗi khác
      throw new Error('Có lỗi xảy ra khi tạo nhân viên');
    }
  }
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

// Xóa nhân viên
const deleteEmployee = async (id: string, request: ISessionUser) => {
  const response = await fetcher(`/employees/${id}`, {
    method: 'DELETE',
    request,
  });
  return response as { success: boolean };
};

// // Tìm kiếm nhân viên
// const searchEmployees = async (query: string, request: ISessionUser) => {
//   const response = await fetcher(`/employees/search?q=${query}`, { request });
//   return response as IEmployeeListResponse;
// };

// // Lọc nhân viên theo trạng thái
// const filterEmployeesByStatus = async (
//   status: "active" | "inactive",
//   request: ISessionUser
// ) => {
//   const response = await fetcher(`/employees?status=${status}`, { request });
//   return response as IEmployeeListResponse;
// };

// // Lọc nhân viên theo phòng ban
// const filterEmployeesByDepartment = async (
//   department: string,
//   request: ISessionUser
// ) => {
//   const response = await fetcher(`/employees?department=${department}`, {
//     request,
//   });
//   return response as IEmployeeListResponse;
// };

export {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getCurrentEmployeeByUserId,
  // searchEmployees,
  // filterEmployeesByStatus,
  // filterEmployeesByDepartment,
};
