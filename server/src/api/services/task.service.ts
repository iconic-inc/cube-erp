import { Types } from 'mongoose';
import { TaskModel } from '../models/task.model';
import { BadRequestError, NotFoundError } from '../core/errors';
import {
  formatAttributeName,
  getReturnData,
  getReturnList,
  removeNestedNullish,
} from '@utils/index';
import {
  ITaskCreate,
  ITaskPopulate,
  ITaskUpdate,
} from '../interfaces/task.interface';
import { TASK } from '@constants/task.constant';
import { EmployeeModel } from '@models/employee.model';
import { USER } from '@constants/user.constant';

// Create new Task
const createTask = async (data: ITaskCreate) => {
  try {
    // Convert assignee IDs to ObjectId
    const assigneeIds = data.assignees.map((id) =>
      new Types.ObjectId(id).toString()
    );

    // Validate if tsk_assignees exist
    const assignees = await EmployeeModel.find({
      _id: { $in: assigneeIds },
    });
    if (assignees.length !== assigneeIds.length) {
      throw new NotFoundError('One or more tsk_assignees not found');
    }

    // Create Task with validated data
    const task = await TaskModel.build({
      ...data,
      startDate: data.startDate?.toString(),
      endDate: data.endDate?.toString(),
      assignees: assignees.map((assignee) => assignee.id),
      description: data.description || '',
      status: data.status || TASK.STATUS.NOT_STARTED,
      priority: data.priority || TASK.PRIORITY.MEDIUM,
    });

    return getReturnData(task);
  } catch (error) {
    console.error('Error in createTask:', error);
    if (error instanceof Error) {
      if (error.name === 'CastError') {
        throw new BadRequestError('Invalid ID format');
      }
      throw error;
    }
    throw new Error('Unknown error occurred while creating Task');
  }
};

// Get all Tasks
const getTasks = async (query: any = {}) => {
  const {
    page = 1,
    limit = 10,
    search,
    sortBy,
    sortOrder = 'desc',
    assignee,
    assignees,
    excludeAssignee,
    status,
    statuses,
    priority,
    priorities,
    isOverdue,
    isDueSoon,
    isCompleted,
    caseService,
    startDateFrom,
    startDateTo,
    endDateFrom,
    endDateTo,
    createdAtFrom,
    createdAtTo,
  } = query;

  // Build the aggregation pipeline
  const pipeline: any[] = [];

  // Stage 1: Join with the employee collection for tsk_assignees
  pipeline.push({
    $lookup: {
      from: USER.EMPLOYEE.COLLECTION_NAME,
      localField: 'tsk_assignees',
      foreignField: '_id',
      as: 'tsk_assignees',
    },
  });

  // Stage 2: Unwind the tsk_assignees array to prepare for user lookup
  pipeline.push({
    $unwind: {
      path: '$tsk_assignees',
      preserveNullAndEmptyArrays: true,
    },
  });

  // Stage 3: Join employees with users to get user details
  pipeline.push({
    $lookup: {
      from: USER.COLLECTION_NAME,
      localField: 'tsk_assignees.emp_user',
      foreignField: '_id',
      as: 'tsk_assignees.emp_user',
    },
  });

  // Stage 4: Unwind the emp_user array to get a single user document
  pipeline.push({
    $unwind: {
      path: '$tsk_assignees.emp_user',
      preserveNullAndEmptyArrays: true,
    },
  });

  // Stage 5: Group the documents back together to restore the original structure
  pipeline.push({
    $group: {
      _id: '$_id',
      tsk_name: { $first: '$tsk_name' },
      tsk_description: { $first: '$tsk_description' },
      tsk_status: { $first: '$tsk_status' },
      tsk_priority: { $first: '$tsk_priority' },
      tsk_startDate: { $first: '$tsk_startDate' },
      tsk_endDate: { $first: '$tsk_endDate' },
      tsk_caseService: { $first: '$tsk_caseService' },
      createdAt: { $first: '$createdAt' },
      updatedAt: { $first: '$updatedAt' },
      tsk_assignees: {
        $push: {
          $cond: [
            { $ifNull: ['$tsk_assignees', false] },
            '$tsk_assignees',
            '$$REMOVE',
          ],
        },
      },
    },
  });

  // Filtering by assignee should be applied BEFORE the $lookup stages
  // We'll apply these filters right after the $group stage

  // Stage 6: Filtering by assignee if provided
  if (assignee) {
    pipeline.push({
      $match: {
        'tsk_assignees._id': new Types.ObjectId(assignee as string),
      },
    });
  }

  // Stage 6.1: Filtering by multiple tsk_assignees if provided
  if (assignees && assignees.length > 0) {
    pipeline.push({
      $match: {
        'tsk_assignees._id': {
          $in: assignees.map((id: string) => new Types.ObjectId(id)),
        },
      },
    });
  }

  // Stage 6.2: Excluding specific assignee if provided
  if (excludeAssignee) {
    pipeline.push({
      $match: {
        'tsk_assignees._id': {
          $nin: [new Types.ObjectId(excludeAssignee as string)],
        },
      },
    });
  }

  // Stage 7: Filtering by status if provided
  if (status) {
    pipeline.push({
      $match: {
        tsk_status: status,
      },
    });
  }

  // Stage 7.1: Filtering by multiple statuses if provided
  if (statuses && statuses.length > 0) {
    pipeline.push({
      $match: {
        tsk_status: { $in: statuses },
      },
    });
  }

  // Stage 8: Filtering by priority if provided
  if (priority) {
    pipeline.push({
      $match: {
        tsk_priority: priority,
      },
    });
  }

  // Stage 8.1: Filtering by multiple priorities if provided
  if (priorities && priorities.length > 0) {
    pipeline.push({
      $match: {
        tsk_priority: { $in: priorities },
      },
    });
  }

  // Stage 8.2: Filtering by case service if provided
  if (caseService) {
    pipeline.push({
      $match: {
        tsk_caseService: new Types.ObjectId(caseService),
      },
    });
  }

  // Stage 8.3: Filtering overdue tasks
  if (isOverdue === true) {
    pipeline.push({
      $match: {
        tsk_endDate: { $lt: new Date() },
        tsk_status: { $ne: TASK.STATUS.COMPLETED },
      },
    });
  }

  // Stage 8.4: Filtering tasks due soon (next 3 days)
  if (isDueSoon === true) {
    const today = new Date();
    const threeDaysLater = new Date();
    threeDaysLater.setDate(today.getDate() + 3);

    pipeline.push({
      $match: {
        tsk_endDate: {
          $gte: today,
          $lte: threeDaysLater,
        },
        tsk_status: { $ne: TASK.STATUS.COMPLETED },
      },
    });
  }

  // Stage 8.5: Filtering completed tasks
  if (isCompleted === true) {
    pipeline.push({
      $match: {
        tsk_status: TASK.STATUS.COMPLETED,
      },
    });
  }

  // Stage 8.6: Filtering by start date range if provided
  if (startDateFrom || startDateTo) {
    const dateFilter: any = {};
    if (startDateFrom) {
      dateFilter.$gte = new Date(startDateFrom);
    }
    if (startDateTo) {
      dateFilter.$lte = new Date(startDateTo);
    }

    pipeline.push({
      $match: {
        tsk_startDate: dateFilter,
      },
    });
  }

  // Stage 8.7: Filtering by end date range if provided
  if (endDateFrom || endDateTo) {
    const dateFilter: any = {};
    if (endDateFrom) {
      dateFilter.$gte = new Date(endDateFrom);
    }
    if (endDateTo) {
      dateFilter.$lte = new Date(endDateTo);
    }

    pipeline.push({
      $match: {
        tsk_endDate: dateFilter,
      },
    });
  }

  // Stage 8.8: Filtering by creation date range if provided
  if (createdAtFrom || createdAtTo) {
    const dateFilter: any = {};
    if (createdAtFrom) {
      dateFilter.$gte = new Date(createdAtFrom);
    }
    if (createdAtTo) {
      dateFilter.$lte = new Date(createdAtTo);
    }

    pipeline.push({
      $match: {
        createdAt: dateFilter,
      },
    });
  }

  // Stage 8.9: Search filter if provided
  if (search) {
    const searchRegex = new RegExp(search, 'i'); // Case-insensitive search
    pipeline.push({
      $match: {
        $or: [{ tsk_name: searchRegex }, { tsk_description: searchRegex }],
      },
    });
  }

  // Stage 9: Project to create a clean output structure
  pipeline.push({
    $project: {
      _id: 1,
      tsk_name: 1,
      tsk_description: 1,
      tsk_status: 1,
      tsk_priority: 1,
      tsk_startDate: 1,
      tsk_endDate: 1,
      createdAt: 1,
      updatedAt: 1,
      tsk_assignees: 1, // Use the already well-structured assignees array
    },
  });

  // Get total count first (for pagination)
  // We need to create a separate count pipeline that doesn't include the unwind and group stages
  const countPipeline: any[] = [];

  // Add lookup stages
  countPipeline.push({
    $lookup: {
      from: USER.EMPLOYEE.COLLECTION_NAME,
      localField: 'tsk_assignees',
      foreignField: '_id',
      as: 'tsk_assignees',
    },
  });

  // Add match stages for filters
  if (assignee) {
    countPipeline.push({
      $match: {
        'tsk_assignees._id': new Types.ObjectId(assignee as string),
      },
    });
  }

  if (assignees && assignees.length > 0) {
    countPipeline.push({
      $match: {
        'tsk_assignees._id': {
          $in: assignees.map((id: string) => new Types.ObjectId(id)),
        },
      },
    });
  }

  if (excludeAssignee) {
    countPipeline.push({
      $match: {
        'tsk_assignees._id': {
          $nin: [new Types.ObjectId(excludeAssignee as string)],
        },
      },
    });
  }

  // Add other match conditions
  if (status) {
    countPipeline.push({
      $match: {
        tsk_status: status,
      },
    });
  }

  if (statuses && statuses.length > 0) {
    countPipeline.push({
      $match: {
        tsk_status: { $in: statuses },
      },
    });
  }

  if (priority) {
    countPipeline.push({
      $match: {
        tsk_priority: priority,
      },
    });
  }

  if (priorities && priorities.length > 0) {
    countPipeline.push({
      $match: {
        tsk_priority: { $in: priorities },
      },
    });
  }

  if (caseService) {
    countPipeline.push({
      $match: {
        tsk_caseService: new Types.ObjectId(caseService),
      },
    });
  }

  if (isOverdue === true) {
    countPipeline.push({
      $match: {
        tsk_endDate: { $lt: new Date() },
        tsk_status: { $ne: TASK.STATUS.COMPLETED },
      },
    });
  }

  if (isDueSoon === true) {
    const today = new Date();
    const threeDaysLater = new Date();
    threeDaysLater.setDate(today.getDate() + 3);

    countPipeline.push({
      $match: {
        tsk_endDate: {
          $gte: today,
          $lte: threeDaysLater,
        },
        tsk_status: { $ne: TASK.STATUS.COMPLETED },
      },
    });
  }

  if (isCompleted === true) {
    countPipeline.push({
      $match: {
        tsk_status: TASK.STATUS.COMPLETED,
      },
    });
  }

  if (startDateFrom || startDateTo) {
    const dateFilter: any = {};
    if (startDateFrom) {
      dateFilter.$gte = new Date(startDateFrom);
    }
    if (startDateTo) {
      dateFilter.$lte = new Date(startDateTo);
    }

    countPipeline.push({
      $match: {
        tsk_startDate: dateFilter,
      },
    });
  }

  if (endDateFrom || endDateTo) {
    const dateFilter: any = {};
    if (endDateFrom) {
      dateFilter.$gte = new Date(endDateFrom);
    }
    if (endDateTo) {
      dateFilter.$lte = new Date(endDateTo);
    }

    countPipeline.push({
      $match: {
        tsk_endDate: dateFilter,
      },
    });
  }

  if (createdAtFrom || createdAtTo) {
    const dateFilter: any = {};
    if (createdAtFrom) {
      dateFilter.$gte = new Date(createdAtFrom);
    }
    if (createdAtTo) {
      dateFilter.$lte = new Date(createdAtTo);
    }

    countPipeline.push({
      $match: {
        createdAt: dateFilter,
      },
    });
  }

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    countPipeline.push({
      $match: {
        $or: [{ tsk_name: searchRegex }, { tsk_description: searchRegex }],
      },
    });
  }

  countPipeline.push({ $count: 'total' });
  const countResult = await TaskModel.aggregate(countPipeline);
  const total = countResult.length > 0 ? countResult[0].total : 0;

  // Stage 10: Sort the results
  const sortField = sortBy || 'createdAt';
  const sortDirection = sortOrder === 'asc' ? 1 : -1;
  pipeline.push({
    $sort: { [sortField]: sortDirection },
  });

  // Stage 11: Apply pagination
  pipeline.push({ $skip: (Number(page) - 1) * Number(limit) });
  pipeline.push({ $limit: Number(limit) });

  // Execute the aggregation
  const tasks = await TaskModel.aggregate<ITaskPopulate>(pipeline);
  const totalPages = Math.ceil(total / Number(limit));

  return {
    data: getReturnList(tasks),
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
    },
  };
};

// Get Task by ID
const getTaskById = async (id: string) => {
  const task = await TaskModel.findById(id).populate({
    path: 'tsk_assignees',
    select: 'emp_code emp_position emp_department emp_user',
    populate: {
      path: 'emp_user',
      select: 'usr_firstName usr_lastName usr_email usr_avatar usr_username',
    },
  });

  if (!task) {
    throw new NotFoundError('Task not found');
  }

  return getReturnData(task);
};

// Update Task
const updateTask = async (id: string, data: ITaskUpdate) => {
  console.log('------------------------------update data: ', data);
  const task = await TaskModel.findByIdAndUpdate(
    id,
    {
      $set: formatAttributeName(
        removeNestedNullish({
          ...data,
          startDate: data.startDate?.toString(),
          endDate: data.endDate?.toString(),
        }),
        TASK.PREFIX
      ),
    },
    { new: true }
  ).populate('tsk_assignees', 'usr_firstName usr_lastName usr_email');

  if (!task) {
    throw new NotFoundError('Task not found');
  }

  return getReturnData(task);
};

// Delete Task
const deleteTask = async (id: string) => {
  const task = await TaskModel.findByIdAndDelete(id);
  if (!task) {
    throw new NotFoundError('Task not found');
  }

  return {
    success: true,
  };
};

// Helper function to calculate end date based on interval type and start date
const calculateEndDate = (startDate: Date, intervalType: string): Date => {
  const endDate = new Date(startDate);

  switch (intervalType) {
    case 'daily':
      endDate.setDate(endDate.getDate() + 1);
      break;
    case 'weekly':
      endDate.setDate(endDate.getDate() + 7);
      break;
    case 'monthly':
      // Lưu lại ngày bắt đầu để xử lý các tháng không có ngày tương ứng
      const startDay = startDate.getDate();
      endDate.setMonth(endDate.getMonth() + 1);

      // Xử lý trường hợp tháng kết thúc không có ngày tương ứng với ngày bắt đầu
      const endMonth = endDate.getMonth();
      endDate.setDate(1); // Đặt về ngày 1 để tránh bị nhảy tháng
      endDate.setMonth(endMonth); // Đặt lại tháng

      // Tính toán ngày cuối cùng của tháng
      const lastDayOfMonth = new Date(
        endDate.getFullYear(),
        endDate.getMonth() + 1,
        0
      ).getDate();

      // Sử dụng ngày ban đầu hoặc ngày cuối cùng của tháng nếu ngày ban đầu lớn hơn
      endDate.setDate(Math.min(startDay, lastDayOfMonth));
      break;
    case 'quarterly':
      // Lưu lại ngày bắt đầu
      const quarterStartDay = startDate.getDate();
      endDate.setMonth(endDate.getMonth() + 3);

      // Xử lý trường hợp tháng kết thúc không có ngày tương ứng
      const quarterEndMonth = endDate.getMonth();
      endDate.setDate(1); // Đặt về ngày 1 để tránh bị nhảy tháng
      endDate.setMonth(quarterEndMonth); // Đặt lại tháng

      // Tính toán ngày cuối cùng của tháng
      const lastDayOfQuarterMonth = new Date(
        endDate.getFullYear(),
        endDate.getMonth() + 1,
        0
      ).getDate();

      // Sử dụng ngày ban đầu hoặc ngày cuối cùng của tháng nếu ngày ban đầu lớn hơn
      endDate.setDate(Math.min(quarterStartDay, lastDayOfQuarterMonth));
      break;
    case 'yearly':
      // Lưu lại ngày và tháng bắt đầu
      const yearStartDay = startDate.getDate();
      const yearStartMonth = startDate.getMonth();

      // Tăng năm lên 1
      endDate.setFullYear(endDate.getFullYear() + 1);

      // Kiểm tra năm nhuận và xử lý trường hợp 29/2
      if (yearStartMonth === 1 && yearStartDay === 29) {
        // Tháng 2, ngày 29
        const isLeapYear =
          new Date(endDate.getFullYear(), 1, 29).getDate() === 29;
        if (!isLeapYear) {
          // Nếu năm kết thúc không phải năm nhuận, sử dụng ngày 28/2
          endDate.setMonth(1); // Tháng 2 (0-indexed)
          endDate.setDate(28);
        } else {
          // Nếu là năm nhuận, giữ nguyên ngày 29/2
          endDate.setMonth(1);
          endDate.setDate(29);
        }
      } else {
        // Đối với các ngày khác, đặt lại tháng và ngày
        endDate.setMonth(yearStartMonth);

        // Xử lý các trường hợp tháng không có ngày tương ứng
        const lastDayOfYearMonth = new Date(
          endDate.getFullYear(),
          yearStartMonth + 1,
          0
        ).getDate();
        endDate.setDate(Math.min(yearStartDay, lastDayOfYearMonth));
      }
      break;
    default:
      throw new BadRequestError('Invalid interval type');
  }

  return endDate;
};

// Get Tasks by user ID
const getTasksByUserId = async (userId: string, query: any = {}) => {
  try {
    // Convert userId to ObjectId
    const assigneeIds = new Types.ObjectId(userId);

    // Build query with tsk_assignees
    const finalQuery = {
      assigneeIds,
      ...query,
    };

    // Get Tasks with populated assignee information
    const tasks = await TaskModel.find(finalQuery)
      .populate('tsk_assignees', 'usr_firstName usr_lastName usr_email')
      .sort({ createdAt: -1 });

    return tasks.map((task) => getReturnData(task));
  } catch (error) {
    console.error('Error in getTasksByUserId:', error);
    if (error instanceof Error) {
      if (error.name === 'CastError') {
        throw new BadRequestError('Invalid userId format');
      }
      throw error;
    }
    throw new Error('Unknown error occurred while getting Tasks by user ID');
  }
};

/**
 * Bulk delete multiple tasks
 */
const bulkDeleteTasks = async (taskIds: string[]) => {
  try {
    // Validate task IDs
    const invalidIds = taskIds.filter((id) => !Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      throw new BadRequestError(
        `Invalid task ID format: ${invalidIds.join(', ')}`
      );
    }

    // Delete tasks
    const result = await TaskModel.deleteMany({
      _id: { $in: taskIds.map((id) => new Types.ObjectId(id)) },
    });

    return {
      success: true,
      message: `${result.deletedCount} tasks deleted successfully`,
      count: result.deletedCount,
    };
  } catch (error) {
    console.error('Error in bulkDeleteTasks:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred while deleting tasks');
  }
};

/**
 * Export tasks to CSV or XLSX
 */
const exportTasks = async (query: any = {}, fileType: 'csv' | 'xlsx') => {
  try {
    const path = require('path');
    const fs = require('fs').promises;
    const createCsvWriter = require('csv-writer').createObjectCsvWriter;
    const XLSX = require('xlsx');

    // Get tasks with filtering but no pagination
    const { data } = await getTasks({
      ...query,
      limit: 1000, // Set a high limit for export
    });

    // Format tasks for export
    const formattedTasks = data.map((task) => ({
      ID: task.id,
      Name: task.tsk_name,
      Status: task.tsk_status,
      Priority: task.tsk_priority,
      'Start Date': new Date(task.tsk_startDate!).toLocaleDateString('vi-VN'),
      'End Date': new Date(task.tsk_endDate!).toLocaleDateString('vi-VN'),
      Assignees: Array.isArray(task.tsk_assignees)
        ? task.tsk_assignees
            .map(
              (a: any) =>
                `${a.emp_user?.usr_firstName || ''} ${
                  a.emp_user?.usr_lastName || ''
                }`
            )
            .join(', ')
        : '',
      'Created At': new Date(task.createdAt!).toLocaleDateString('vi-VN'),
      'Updated At': new Date(task.updatedAt!).toLocaleDateString('vi-VN'),
    }));

    // Vietnamese headers for better readability
    const vietnameseHeaders = {
      ID: 'ID',
      Name: 'Tên nhiệm vụ',
      Description: 'Mô tả',
      Status: 'Trạng thái',
      Priority: 'Độ ưu tiên',
      'Start Date': 'Ngày bắt đầu',
      'End Date': 'Ngày kết thúc',
      Assignees: 'Người thực hiện',
      'Created At': 'Ngày tạo',
      'Updated At': 'Ngày cập nhật',
    };

    // Translate status and priority values to Vietnamese
    const formattedTasksInVietnamese = formattedTasks.map((task) => ({
      ...task,
      Status: translateStatusToVietnamese(task.Status || ''),
      Priority: translatePriorityToVietnamese(task.Priority || ''),
    }));

    // Generate filename
    const date = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
    const fileName = `nhiem_vu_${date}_${Date.now()}.${fileType}`;
    const filePath = path.join(process.cwd(), 'public', 'exports', fileName);

    // Ensure the exports directory exists
    await fs.mkdir(path.join(process.cwd(), 'public', 'exports'), {
      recursive: true,
    });

    // Generate file content based on file type
    if (fileType === 'csv') {
      // Implementation for CSV export
      const csvWriter = createCsvWriter({
        path: filePath,
        header: Object.entries(vietnameseHeaders).map(([id, title]) => ({
          id,
          title,
        })),
        encoding: 'utf8',
      });

      await csvWriter.writeRecords(formattedTasksInVietnamese);
    } else {
      // Implementation for XLSX export
      const worksheet = XLSX.utils.json_to_sheet(formattedTasksInVietnamese, {
        header: Object.keys(vietnameseHeaders),
        skipHeader: true,
      });

      // Add header row with Vietnamese titles
      XLSX.utils.sheet_add_aoa(worksheet, [Object.values(vietnameseHeaders)], {
        origin: 'A1',
      });

      // Style the header row
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!worksheet[cellRef]) continue;
        worksheet[cellRef].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '4472C4' } },
        };
      }

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Nhiệm vụ');

      // Write to file
      XLSX.writeFile(workbook, filePath);
    }

    return {
      fileUrl: `/exports/${fileName}`,
      fileName,
      count: formattedTasksInVietnamese.length,
    };
  } catch (error) {
    console.error('Error in exportTasks:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred while exporting tasks');
  }
};

/**
 * Helper function to translate task status to Vietnamese
 */
const translateStatusToVietnamese = (status: string): string => {
  switch (status) {
    case 'not_started':
      return 'Chưa bắt đầu';
    case 'in_progress':
      return 'Đang thực hiện';
    case 'completed':
      return 'Hoàn thành';
    case 'cancelled':
      return 'Đã hủy';
    default:
      return status;
  }
};

/**
 * Helper function to translate task priority to Vietnamese
 */
const translatePriorityToVietnamese = (priority: string): string => {
  switch (priority) {
    case 'low':
      return 'Thấp';
    case 'medium':
      return 'Trung bình';
    case 'high':
      return 'Cao';
    case 'urgent':
      return 'Khẩn cấp';
    default:
      return priority;
  }
};

export {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  calculateEndDate,
  getTasksByUserId,
  bulkDeleteTasks,
  exportTasks,
};
