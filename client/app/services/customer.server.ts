import { ISessionUser } from '~/interfaces/auth.interface';
import { fetcher } from '.';
import {
  ICustomer,
  ICustomerCreate,
  ICustomerStatisticsQuery,
  IUpdateCustomerData,
} from '~/interfaces/customer.interface';
import { IListResponse } from '~/interfaces/response.interface';

// Lấy danh sách khách hàng với phân trang và query
const getCustomers = async (
  searchParams: URLSearchParams,
  request: ISessionUser,
) => {
  const response = await fetcher<IListResponse<ICustomer>>(
    `/customers?${searchParams.toString()}`,
    { request },
  );
  return response;
};

// Lấy thông tin một khách hàng
const getCustomerById = async (id: string, request: ISessionUser) => {
  // Thêm tham số để lấy thông tin từ CaseService
  const response = await fetcher<any>(`/customers/${id}`, {
    request,
  });
  return response as ICustomer;
};

// Tạo khách hàng mới
const createCustomer = async (
  customerData: ICustomerCreate,
  request: ISessionUser,
) => {
  try {
    const response = await fetcher<ICustomer>('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
      request,
    });

    return response;
  } catch (error: any) {
    console.error('Error creating customer:', error);
    throw error;
  }
};

// Cập nhật thông tin khách hàng
const updateCustomer = async (
  id: string,
  data: IUpdateCustomerData,
  request: ISessionUser,
) => {
  try {
    const response = await fetcher<ICustomer>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      request,
    });
    return response;
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error;
  }
};

// Xóa khách hàng
const deleteCustomer = async (customerId: string, request: ISessionUser) => {
  try {
    const response = await fetcher<any>(`/customers/${customerId}`, {
      method: 'DELETE',
      request,
    });
    return response as { success: boolean; message: string };
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw error;
  }
};

// Lấy thống kê khách hàng
const getCustomerStatistics = async (
  query: ICustomerStatisticsQuery,
  request: ISessionUser,
) => {
  try {
    const params = new URLSearchParams();
    params.append('groupBy', query.groupBy);

    if (query.dateRange) {
      params.append('startDate', query.dateRange.start);
      params.append('endDate', query.dateRange.end);
    }

    const response = await fetcher<any>(
      `/customers/statistics?${params.toString()}`,
      { request },
    );
    return response;
  } catch (error) {
    console.error('Error getting customer statistics:', error);
    throw error;
  }
};

// Xóa nhiều khách hàng
const deleteMultipleCustomers = async (
  customerIds: string[],
  request: ISessionUser,
) => {
  try {
    const response = await fetcher<any>(`/customers/delete-multiple`, {
      method: 'DELETE',
      request,
      body: JSON.stringify({ customerIds }),
    });
    return response as { success: boolean; message: string };
  } catch (error) {
    console.error('Error deleting multiple customers:', error);
    throw error;
  }
};

// Xuất dữ liệu nhân viên
const exportCustomers = async (
  searchParams: URLSearchParams,
  fileType: 'csv' | 'xlsx',
  request: ISessionUser,
) => {
  return await fetcher<{ fileUrl: string; fileName: string; count: number }>(
    `/customers/export/${fileType}?${searchParams.toString()}`,
    {
      method: 'GET',
      request,
    },
  );
};

// Import customers from Excel file
const importCustomers = async (
  file: File,
  overwrite: boolean,
  request: ISessionUser,
) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('overwrite', overwrite.toString());

  const response = await fetcher<{
    imported: number;
    updated: number;
    errors: Array<{
      row: number;
      error: string;
      data: any;
    }>;
  }>('/customers/import/xlsx', {
    request,
    method: 'POST',
    body: formData,
    headers: {}, // Let fetch handle content-type for FormData
  });

  return response;
};

export {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerStatistics,
  deleteMultipleCustomers,
  exportCustomers,
  importCustomers,
};
