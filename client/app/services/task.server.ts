import { ISessionUser } from '~/interfaces/auth.interface';
import { fetcher } from '.';
import { ITask, ITaskCreate, ITaskUpdate } from '~/interfaces/task.interface';
import { IListResponse } from '~/interfaces/response.interface';

/**
 * Fetches a list of tasks with optional filtering, pagination, and sorting
 */
const getTasks = async (
  searchParams: URLSearchParams,
  request: ISessionUser,
) => {
  const response = await fetcher(`/tasks?${searchParams.toString()}`, {
    request,
  });
  return response as IListResponse<ITask>;
};

/**
 * Fetches a specific task by ID
 */
const getTaskById = async (id: string, request: ISessionUser) => {
  const response = await fetcher(`/tasks/${id}`, { request });
  return response as ITask;
};

/**
 * Fetches a specific task by ID for the current user
 */
const getMyTaskById = async (id: string, request: ISessionUser) => {
  const response = await fetcher(`/employees/me/tasks/${id}`, { request });
  return response as ITask;
};

/**
 * Fetches tasks assigned to the current user
 */
const getMyTasks = async (
  searchParams: URLSearchParams,
  request: ISessionUser,
) => {
  // Add current user as assignee
  searchParams.set('assignee', request.user.id);

  const response = await fetcher(
    `/employees/me/tasks?${searchParams.toString()}`,
    {
      request,
    },
  );
  return response as IListResponse<ITask>;
};

/**
 * Creates a new task
 */
const createTask = async (data: ITaskCreate, request: ISessionUser) => {
  try {
    // Format dates if they are Date objects
    const formattedData = {
      ...data,
      startDate:
        data.startDate instanceof Date
          ? data.startDate.toISOString()
          : data.startDate,
      endDate:
        data.endDate instanceof Date
          ? data.endDate.toISOString()
          : data.endDate,
    };

    const response = await fetcher('/tasks', {
      method: 'POST',
      body: JSON.stringify(formattedData),
      request,
    });
    return response as ITask;
  } catch (error: any) {
    console.error('Error in createTask:', error);

    // Error handling similar to employee service
    if (error instanceof SyntaxError || error.message?.includes('JSON')) {
      console.error('Invalid JSON response from server');
      throw new Error('Lỗi từ server: Phản hồi không hợp lệ');
    } else if (error.status === 400) {
      try {
        const errorData = await error.json();
        throw new Error(errorData.message || 'Dữ liệu không hợp lệ');
      } catch (jsonError) {
        console.error('Failed to parse error response:', jsonError);
        throw new Error('Dữ liệu không hợp lệ');
      }
    } else {
      throw new Error('Có lỗi xảy ra khi tạo nhiệm vụ');
    }
  }
};

/**
 * Updates an existing task
 */
const updateTask = async (
  id: string,
  data: ITaskUpdate,
  request: ISessionUser,
) => {
  try {
    // Format dates if they are Date objects
    const formattedData = {
      ...data,
      startDate:
        data.startDate instanceof Date
          ? data.startDate.toISOString()
          : data.startDate,
      endDate:
        data.endDate instanceof Date
          ? data.endDate.toISOString()
          : data.endDate,
    };

    const response = await fetcher(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(formattedData),
      request,
    });
    return response as ITask;
  } catch (error: any) {
    console.error('Error in updateTask:', error);

    if (error instanceof SyntaxError || error.message?.includes('JSON')) {
      console.error('Invalid JSON response from server');
      throw new Error('Lỗi từ server: Phản hồi không hợp lệ');
    } else if (error.status === 400) {
      try {
        const errorData = await error.json();
        throw new Error(errorData.message || 'Dữ liệu không hợp lệ');
      } catch (jsonError) {
        console.error('Failed to parse error response:', jsonError);
        throw new Error('Dữ liệu không hợp lệ');
      }
    } else if (error.status === 404) {
      throw new Error('Nhiệm vụ không tồn tại');
    } else {
      throw new Error('Có lỗi xảy ra khi cập nhật nhiệm vụ');
    }
  }
};

/**
 * Deletes a task
 */
const deleteTask = async (id: string, request: ISessionUser) => {
  try {
    const response = await fetcher(`/tasks/${id}`, {
      method: 'DELETE',
      request,
    });
    return response as { success: boolean };
  } catch (error: any) {
    console.error('Error in deleteTask:', error);

    if (error.status === 404) {
      throw new Error('Nhiệm vụ không tồn tại');
    } else {
      throw new Error('Có lỗi xảy ra khi xóa nhiệm vụ');
    }
  }
};

/**
 * Bulk delete multiple tasks
 */
const bulkDeleteTasks = async (taskIds: string[], request: ISessionUser) => {
  try {
    const response = await fetcher('/tasks/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ taskIds }),
      request,
    });
    return response as { success: boolean; message: string };
  } catch (error: any) {
    console.error('Error in bulkDeleteTasks:', error);
    throw new Error('Có lỗi xảy ra khi xóa nhiều nhiệm vụ');
  }
};

/**
 * Export tasks to CSV or XLSX
 */
const exportTasks = async (
  searchParams: URLSearchParams,
  fileType: 'csv' | 'xlsx',
  request: ISessionUser,
) => {
  try {
    return await fetcher<{ fileUrl: string; fileName: string; count: number }>(
      `/tasks/export/${fileType}?${searchParams.toString()}`,
      {
        method: 'GET',
        request,
      },
    );
  } catch (error: any) {
    console.error('Error in exportTasks:', error);
    throw new Error('Có lỗi xảy ra khi xuất dữ liệu nhiệm vụ');
  }
};

const getEmployeesPerformance = async (
  searchParams: URLSearchParams,
  request: ISessionUser,
) => {
  const performanceData = await fetcher(
    `/tasks/performance?${searchParams.toString()}`,
    {
      request,
    },
  );
  return performanceData;
};

const getMyTaskPerformance = async (
  searchParams: URLSearchParams,
  request: ISessionUser,
) => {
  const performanceData = await fetcher(
    `/employees/me/tasks/performance?${searchParams.toString()}`,
    {
      request,
    },
  );
  return performanceData;
};

export {
  getTasks,
  getTaskById,
  getMyTaskById,
  getMyTasks,
  createTask,
  updateTask,
  deleteTask,
  bulkDeleteTasks,
  exportTasks,
  getEmployeesPerformance,
  getMyTaskPerformance,
};
