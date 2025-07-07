import { ISessionUser } from '~/interfaces/auth.interface';
import { fetcher } from '.';
import {
  ITask,
  ITaskCreate,
  ITaskQuery,
  ITaskUpdate,
} from '~/interfaces/task.interface';
import { IListResponse } from '~/interfaces/response.interface';
import { IPaginationOptions } from '~/interfaces/request.interface';

/**
 * Fetches a list of tasks with optional filtering, pagination, and sorting
 */
const getTasks = async (
  query: ITaskQuery = {},
  options: IPaginationOptions = {},
  request: ISessionUser,
) => {
  const { page = 1, limit = 10, sortBy, sortOrder } = options;
  const searchParams = new URLSearchParams();

  // Add pagination and sorting params
  searchParams.set('page', String(page));
  searchParams.set('limit', String(limit));
  if (sortBy) searchParams.set('sortBy', sortBy);
  if (sortOrder) searchParams.set('sortOrder', sortOrder);

  // Add basic filtering params
  if (query.search) searchParams.set('search', query.search);
  if (query.assignee) searchParams.set('assignee', query.assignee);
  if (query.status) searchParams.set('status', query.status);
  if (query.priority) searchParams.set('priority', query.priority);

  // Add advanced filtering params
  if (query.assignees && query.assignees.length > 0) {
    query.assignees.forEach((id) => {
      searchParams.append('assignees', id);
    });
  }

  if (query.excludeAssignee)
    searchParams.set('excludeAssignee', query.excludeAssignee);

  if (query.statuses && query.statuses.length > 0) {
    query.statuses.forEach((status) => {
      searchParams.append('statuses', status);
    });
  }

  if (query.priorities && query.priorities.length > 0) {
    query.priorities.forEach((priority) => {
      searchParams.append('priorities', priority);
    });
  }

  if (query.createdBy) searchParams.set('createdBy', query.createdBy);
  if (query.isOverdue !== undefined)
    searchParams.set('isOverdue', String(query.isOverdue));
  if (query.isDueSoon !== undefined)
    searchParams.set('isDueSoon', String(query.isDueSoon));
  if (query.isCompleted !== undefined)
    searchParams.set('isCompleted', String(query.isCompleted));
  if (query.caseService) searchParams.set('caseService', query.caseService);

  // Add date filtering params
  if (query.startDateFrom)
    searchParams.set(
      'startDateFrom',
      new Date(query.startDateFrom).toISOString(),
    );
  if (query.startDateTo)
    searchParams.set('startDateTo', new Date(query.startDateTo).toISOString());
  if (query.endDateFrom)
    searchParams.set('endDateFrom', new Date(query.endDateFrom).toISOString());
  if (query.endDateTo)
    searchParams.set('endDateTo', new Date(query.endDateTo).toISOString());
  if (query.createdAtFrom)
    searchParams.set(
      'createdAtFrom',
      new Date(query.createdAtFrom).toISOString(),
    );
  if (query.createdAtTo)
    searchParams.set('createdAtTo', new Date(query.createdAtTo).toISOString());

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
  query: ITaskQuery = {},
  options: IPaginationOptions = {},
  request: ISessionUser,
) => {
  const { page = 1, limit = 10, sortBy, sortOrder } = options;
  const searchParams = new URLSearchParams();

  // Add pagination and sorting params
  searchParams.set('page', String(page));
  searchParams.set('limit', String(limit));
  if (sortBy) searchParams.set('sortBy', sortBy);
  if (sortOrder) searchParams.set('sortOrder', sortOrder);

  // Add basic filtering params (excluding assignee as we're filtering by current user)
  if (query.search) searchParams.set('search', query.search);
  if (query.status) searchParams.set('status', query.status);
  if (query.priority) searchParams.set('priority', query.priority);

  // Add advanced filtering params
  if (Array.isArray(query.statuses) && query.statuses.length > 0) {
    query.statuses.forEach((status) => {
      searchParams.append('statuses', status);
    });
  }

  if (query.priorities && query.priorities.length > 0) {
    query.priorities.forEach((priority) => {
      searchParams.append('priorities', priority);
    });
  }

  if (query.createdBy) searchParams.set('createdBy', query.createdBy);
  if (query.isOverdue !== undefined)
    searchParams.set('isOverdue', String(query.isOverdue));
  if (query.isDueSoon !== undefined)
    searchParams.set('isDueSoon', String(query.isDueSoon));
  if (query.isCompleted !== undefined)
    searchParams.set('isCompleted', String(query.isCompleted));
  if (query.caseService) searchParams.set('caseService', query.caseService);

  // Add date filtering params
  if (query.startDateFrom)
    searchParams.set(
      'startDateFrom',
      new Date(query.startDateFrom).toISOString(),
    );
  if (query.startDateTo)
    searchParams.set('startDateTo', new Date(query.startDateTo).toISOString());
  if (query.endDateFrom)
    searchParams.set('endDateFrom', new Date(query.endDateFrom).toISOString());
  if (query.endDateTo)
    searchParams.set('endDateTo', new Date(query.endDateTo).toISOString());
  if (query.createdAtFrom)
    searchParams.set(
      'createdAtFrom',
      new Date(query.createdAtFrom).toISOString(),
    );
  if (query.createdAtTo)
    searchParams.set('createdAtTo', new Date(query.createdAtTo).toISOString());

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
  query: ITaskQuery = {},
  options: IPaginationOptions = {},
  fileType: 'csv' | 'xlsx',
  request: ISessionUser,
) => {
  try {
    const searchParams = new URLSearchParams();

    // Add filtering params
    if (query.search) searchParams.set('search', query.search);
    if (query.assignee) searchParams.set('assignee', query.assignee);
    if (query.status) searchParams.set('status', query.status);
    if (query.priority) searchParams.set('priority', query.priority);
    if (query.startDateFrom)
      searchParams.set(
        'startDateFrom',
        new Date(query.startDateFrom).toISOString(),
      );
    if (query.startDateTo)
      searchParams.set(
        'startDateTo',
        new Date(query.startDateTo).toISOString(),
      );
    if (query.endDateFrom)
      searchParams.set(
        'endDateFrom',
        new Date(query.endDateFrom).toISOString(),
      );
    if (query.endDateTo)
      searchParams.set('endDateTo', new Date(query.endDateTo).toISOString());

    if (options.sortBy) searchParams.set('sortBy', options.sortBy);
    if (options.sortOrder) searchParams.set('sortOrder', options.sortOrder);

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
  query: ITaskQuery = {},
  options: IPaginationOptions = {},
  request: ISessionUser,
) => {
  const { page = 1, limit = 10, sortBy, sortOrder } = options;
  const searchParams = new URLSearchParams();
  // Add pagination and sorting params
  searchParams.set('page', String(page));
  searchParams.set('limit', String(limit));
  if (sortBy) searchParams.set('sortBy', sortBy);
  if (sortOrder) searchParams.set('sortOrder', sortOrder);
  // Add basic filtering params
  if (query.search) searchParams.set('search', query.search);
  if (query.assignee) searchParams.set('assignee', query.assignee);
  if (query.status) searchParams.set('status', query.status);
  if (query.priority) searchParams.set('priority', query.priority);

  const performanceData = await fetcher(
    `/tasks/performance?${searchParams.toString()}`,
    {
      request,
    },
  );
  return performanceData;
};

const getMyTaskPerformance = async (
  query: ITaskQuery = {},
  options: IPaginationOptions = {},
  request: ISessionUser,
) => {
  const { page = 1, limit = 10, sortBy, sortOrder } = options;
  const searchParams = new URLSearchParams();
  // Add pagination and sorting params
  searchParams.set('page', String(page));
  searchParams.set('limit', String(limit));
  if (sortBy) searchParams.set('sortBy', sortBy);
  if (sortOrder) searchParams.set('sortOrder', sortOrder);
  // Add basic filtering params
  if (query.search) searchParams.set('search', query.search);
  if (query.assignee) searchParams.set('assignee', query.assignee);
  if (query.status) searchParams.set('status', query.status);
  if (query.priority) searchParams.set('priority', query.priority);

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
