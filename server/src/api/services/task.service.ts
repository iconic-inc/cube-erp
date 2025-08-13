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
import { CASE_SERVICE } from '@constants/caseService.constant';
import { EmployeeModel } from '@models/employee.model';
import { USER } from '@constants/user.constant';
import { getEmployeeByUserId } from './employee.service';
import { sendTaskNotificationEmail } from './email.service';

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

    // Get the created task with populated data for email notification
    const populatedTask = await TaskModel.findById(task._id)
      .populate(taskAssigneesPopulate)
      .populate(taskCaseServicePopulate);

    // Send email notifications to assignees
    if (populatedTask && populatedTask.tsk_assignees) {
      const emailPromises = populatedTask.tsk_assignees.map(
        async (assignee: any) => {
          if (assignee.emp_user?.usr_email) {
            try {
              await sendTaskNotificationEmail(assignee.emp_user.usr_email, {
                taskId: populatedTask._id.toString(),
                taskName: populatedTask.tsk_name,
                taskDescription:
                  populatedTask.tsk_description || 'Không có mô tả',
                priority: populatedTask.tsk_priority,
                startDate: new Date(populatedTask.tsk_startDate).toLocaleString(
                  'vi-VN'
                ),
                endDate: new Date(populatedTask.tsk_endDate).toLocaleString(
                  'vi-VN'
                ),
                employeeName: `${assignee.emp_user.usr_firstName || ''} ${
                  assignee.emp_user.usr_lastName || ''
                }`.trim(),
              });
            } catch (emailError) {
              console.error(
                `Failed to send email to ${assignee.emp_user.usr_email}:`,
                emailError
              );
              // Don't throw error here to avoid blocking task creation
            }
          }
        }
      );

      // Execute all email sending promises without blocking
      Promise.all(emailPromises).catch((error) => {
        console.error('Some emails failed to send:', error);
      });
    }

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
      tsk_caseOrder: { $first: '$tsk_caseOrder' },
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

  // Stage 5.1: Lookup case service information
  pipeline.push({
    $lookup: {
      from: CASE_SERVICE.COLLECTION_NAME,
      localField: 'tsk_caseService',
      foreignField: '_id',
      as: 'tsk_caseService',
      pipeline: [
        {
          $lookup: {
            from: 'customers',
            localField: 'case_customer',
            foreignField: '_id',
            as: 'case_customer',
          },
        },
        {
          $unwind: { path: '$case_customer', preserveNullAndEmptyArrays: true },
        },
        {
          $project: {
            _id: 1,
            case_code: 1,
            case_status: 1,
            case_startDate: 1,
            case_endDate: 1,
            case_customer: {
              _id: 1,
              cus_firstName: 1,
              cus_lastName: 1,
              cus_code: 1,
            },
          },
        },
      ],
    },
  });

  // Stage 5.2: Unwind case service to get single document
  pipeline.push({
    $unwind: { path: '$tsk_caseService', preserveNullAndEmptyArrays: true },
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
        'tsk_caseService._id': new Types.ObjectId(caseService as string),
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
        $or: [
          { tsk_name: searchRegex },
          { tsk_description: searchRegex },
          {
            tsk_assignees: {
              $elemMatch: { 'emp_user.usr_firstName': { $regex: searchRegex } },
            },
          },
          {
            'tsk_caseService.case_code': { $regex: searchRegex },
          },
        ],
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
      tsk_caseOrder: 1,
      tsk_caseService: 1, // This now includes the populated case service data
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
        tsk_caseService: new Types.ObjectId(caseService as string),
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

const taskAssigneesPopulate = {
  path: 'tsk_assignees',
  select: 'emp_code emp_position emp_department emp_user',
  populate: {
    path: 'emp_user',
    select: 'usr_firstName usr_lastName usr_email usr_avatar usr_username',
  },
};
const taskCaseServicePopulate = {
  path: 'tsk_caseService',
  select:
    'case_code case_customer case_leadAttorney case_status case_startDate case_endDate',
  populate: {
    path: 'case_customer',
    select: 'cus_firstName cus_lastName cus_email cus_msisdn cus_code',
  },
};
// Get Task by ID
const getTaskById = async (id: string) => {
  const task = await TaskModel.findById(id)
    .populate(taskAssigneesPopulate)
    .populate(taskCaseServicePopulate);

  if (!task) {
    throw new NotFoundError('Task not found');
  }

  return getReturnData(task);
};

// Update Task
const updateTask = async (id: string, data: ITaskUpdate) => {
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

const getEmployeesPerformance = async (query: any = {}) => {
  try {
    const {
      startDate,
      endDate,
      employeeIds,
      sortBy = 'completionRate',
      sortOrder = 'desc',
      limit = 10,
      page = 1,
    } = query;

    // Set default date range if not provided (last 30 days)
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);

    const periodStartDate = startDate ? new Date(startDate) : defaultStartDate;
    const periodEndDate = endDate ? new Date(endDate) : defaultEndDate;

    // Build aggregation pipeline
    const pipeline: any[] = [];

    // Stage 1: Match tasks within the date range
    pipeline.push({
      $match: {
        $or: [
          {
            tsk_startDate: {
              $gte: periodStartDate,
              $lte: periodEndDate,
            },
          },
          {
            tsk_endDate: {
              $gte: periodStartDate,
              $lte: periodEndDate,
            },
          },
          {
            updatedAt: {
              $gte: periodStartDate,
              $lte: periodEndDate,
            },
          },
        ],
      },
    });

    // Stage 2: Unwind assignees to analyze individual performance
    pipeline.push({
      $unwind: {
        path: '$tsk_assignees',
        preserveNullAndEmptyArrays: false,
      },
    });

    // Stage 3: Filter by specific employees if provided
    if (employeeIds && employeeIds.length > 0) {
      pipeline.push({
        $match: {
          tsk_assignees: {
            $in: employeeIds.map((id: string) => new Types.ObjectId(id)),
          },
        },
      });
    }

    // Stage 4: Lookup employee details
    pipeline.push({
      $lookup: {
        from: USER.EMPLOYEE.COLLECTION_NAME,
        localField: 'tsk_assignees',
        foreignField: '_id',
        as: 'employee',
      },
    });

    pipeline.push({
      $unwind: {
        path: '$employee',
        preserveNullAndEmptyArrays: false,
      },
    });

    // Stage 5: Lookup user details for employee
    pipeline.push({
      $lookup: {
        from: USER.COLLECTION_NAME,
        localField: 'employee.emp_user',
        foreignField: '_id',
        as: 'employee.emp_user',
      },
    });

    pipeline.push({
      $unwind: {
        path: '$employee.emp_user',
        preserveNullAndEmptyArrays: true,
      },
    });

    // Stage 6: Calculate task metrics
    pipeline.push({
      $addFields: {
        isCompleted: {
          $cond: [{ $eq: ['$tsk_status', TASK.STATUS.COMPLETED] }, 1, 0],
        },
        isOverdue: {
          $cond: [
            {
              $and: [
                { $lt: ['$tsk_endDate', new Date()] },
                { $ne: ['$tsk_status', TASK.STATUS.COMPLETED] },
              ],
            },
            1,
            0,
          ],
        },
        isOnTime: {
          $cond: [
            {
              $and: [
                { $eq: ['$tsk_status', TASK.STATUS.COMPLETED] },
                { $lte: ['$updatedAt', '$tsk_endDate'] },
              ],
            },
            1,
            0,
          ],
        },
        priorityScore: {
          $switch: {
            branches: [
              { case: { $eq: ['$tsk_priority', TASK.PRIORITY.LOW] }, then: 1 },
              {
                case: { $eq: ['$tsk_priority', TASK.PRIORITY.MEDIUM] },
                then: 2,
              },
              { case: { $eq: ['$tsk_priority', TASK.PRIORITY.HIGH] }, then: 3 },
              {
                case: { $eq: ['$tsk_priority', TASK.PRIORITY.URGENT] },
                then: 4,
              },
            ],
            default: 2,
          },
        },
      },
    });

    // Stage 7: Group by employee to calculate performance metrics
    pipeline.push({
      $group: {
        _id: '$employee._id',
        employee: { $first: '$employee' },
        totalTasks: { $sum: 1 },
        completedTasks: { $sum: '$isCompleted' },
        overdueTasks: { $sum: '$isOverdue' },
        onTimeTasks: { $sum: '$isOnTime' },
        averagePriorityScore: { $avg: '$priorityScore' },
        totalPriorityScore: { $sum: '$priorityScore' },
        tasksByStatus: {
          $push: {
            status: '$tsk_status',
            priority: '$tsk_priority',
            startDate: '$tsk_startDate',
            endDate: '$tsk_endDate',
            isCompleted: '$isCompleted',
            isOverdue: '$isOverdue',
            isOnTime: '$isOnTime',
          },
        },
      },
    });

    // Stage 8: Calculate performance metrics
    pipeline.push({
      $addFields: {
        completionRate: {
          $cond: [
            { $gt: ['$totalTasks', 0] },
            {
              $multiply: [{ $divide: ['$completedTasks', '$totalTasks'] }, 100],
            },
            0,
          ],
        },
        onTimeRate: {
          $cond: [
            { $gt: ['$completedTasks', 0] },
            {
              $multiply: [
                { $divide: ['$onTimeTasks', '$completedTasks'] },
                100,
              ],
            },
            0,
          ],
        },
        overdueRate: {
          $cond: [
            { $gt: ['$totalTasks', 0] },
            { $multiply: [{ $divide: ['$overdueTasks', '$totalTasks'] }, 100] },
            0,
          ],
        },
        performanceScore: {
          $add: [
            // Completion rate weight: 40%
            {
              $multiply: [{ $divide: ['$completedTasks', '$totalTasks'] }, 40],
            },
            // On-time rate weight: 30%
            {
              $multiply: [
                {
                  $cond: [
                    { $gt: ['$completedTasks', 0] },
                    { $divide: ['$onTimeTasks', '$completedTasks'] },
                    0,
                  ],
                },
                30,
              ],
            },
            // Priority handling weight: 20%
            { $multiply: [{ $divide: ['$averagePriorityScore', 4] }, 20] },
            // Task volume weight: 10%
            {
              $multiply: [
                {
                  $cond: [
                    { $gte: ['$totalTasks', 10] },
                    1,
                    { $divide: ['$totalTasks', 10] },
                  ],
                },
                10,
              ],
            },
          ],
        },
      },
    });

    // Stage 9: Project final structure
    pipeline.push({
      $project: {
        _id: 1,
        employeeId: '$employee._id',
        employeeCode: '$employee.emp_code',
        employeeName: {
          $concat: [
            { $ifNull: ['$employee.emp_user.usr_firstName', ''] },
            ' ',
            { $ifNull: ['$employee.emp_user.usr_lastName', ''] },
          ],
        },
        employeeEmail: '$employee.emp_user.usr_email',
        employeeAvatar: '$employee.emp_user.usr_avatar',
        department: '$employee.emp_department',
        position: '$employee.emp_position',
        totalTasks: 1,
        completedTasks: 1,
        overdueTasks: 1,
        onTimeTasks: 1,
        completionRate: { $round: ['$completionRate', 2] },
        onTimeRate: { $round: ['$onTimeRate', 2] },
        overdueRate: { $round: ['$overdueRate', 2] },
        performanceScore: { $round: ['$performanceScore', 2] },
        averagePriorityScore: { $round: ['$averagePriorityScore', 2] },
        totalPriorityScore: 1,
        tasksByStatus: 1,
      },
    });

    // Stage 10: Sort results
    const sortField =
      sortBy === 'completionRate'
        ? 'completionRate'
        : sortBy === 'onTimeRate'
        ? 'onTimeRate'
        : sortBy === 'performanceScore'
        ? 'performanceScore'
        : sortBy === 'totalTasks'
        ? 'totalTasks'
        : 'performanceScore';

    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    pipeline.push({
      $sort: { [sortField]: sortDirection },
    });

    // Get total count for pagination
    const countPipeline = [...pipeline];
    countPipeline.push({ $count: 'total' });
    const countResult = await TaskModel.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Stage 11: Apply pagination
    pipeline.push({ $skip: (Number(page) - 1) * Number(limit) });
    pipeline.push({ $limit: Number(limit) });

    // Execute aggregation
    const performanceData = await TaskModel.aggregate(pipeline);

    // Calculate summary statistics
    const summaryPipeline = [
      ...pipeline.slice(0, -2), // Remove pagination stages
    ];

    summaryPipeline.push({
      $group: {
        _id: null,
        totalEmployees: { $sum: 1 },
        averageCompletionRate: { $avg: '$completionRate' },
        averageOnTimeRate: { $avg: '$onTimeRate' },
        averagePerformanceScore: { $avg: '$performanceScore' },
        totalTasksProcessed: { $sum: '$totalTasks' },
        totalCompletedTasks: { $sum: '$completedTasks' },
        totalOverdueTasks: { $sum: '$overdueTasks' },
      },
    });

    const summaryResult = await TaskModel.aggregate(summaryPipeline);
    const summary =
      summaryResult.length > 0
        ? summaryResult[0]
        : {
            totalEmployees: 0,
            averageCompletionRate: 0,
            averageOnTimeRate: 0,
            averagePerformanceScore: 0,
            totalTasksProcessed: 0,
            totalCompletedTasks: 0,
            totalOverdueTasks: 0,
          };

    const totalPages = Math.ceil(total / Number(limit));

    return {
      data: getReturnList(performanceData),
      summary: {
        ...summary,
        averageCompletionRate:
          Math.round(summary.averageCompletionRate * 100) / 100,
        averageOnTimeRate: Math.round(summary.averageOnTimeRate * 100) / 100,
        averagePerformanceScore:
          Math.round(summary.averagePerformanceScore * 100) / 100,
        periodStart: periodStartDate,
        periodEnd: periodEndDate,
      },
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages,
      },
    };
  } catch (error) {
    console.error('Error in getEmployeesPerformance:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(
      'Unknown error occurred while getting employees performance'
    );
  }
};

const getMyTasks = async (userId: string, query: any = {}) => {
  const employee = await getEmployeeByUserId(userId);
  const myTasks = await getTasks({
    ...query,
    assignee: employee.id,
    sortBy: query.sortBy || 'createdAt',
    sortOrder: query.sortOrder || 'desc',
    limit: query.limit || 10,
    page: query.page || 1,
  });
  return myTasks;
};

const getMyTaskById = async (userId: string, taskId: string) => {
  const employee = await getEmployeeByUserId(userId);
  const task = await TaskModel.findOne({
    _id: taskId,
    tsk_assignees: employee.id,
  })
    .populate(taskAssigneesPopulate)
    .populate(taskCaseServicePopulate);

  if (!task) {
    throw new NotFoundError(
      'Không tìm thấy Task hoặc bạn không có quyền truy cập'
    );
  }

  return getReturnData(task);
};

const getMyPerformance = async (userId: string, query: any = {}) => {
  const employee = await getEmployeeByUserId(userId);

  return await getEmployeesPerformance({
    ...query,
    employeeIds: [employee.id],
    sortBy: query.sortBy || 'performanceScore',
    sortOrder: query.sortOrder || 'desc',
    limit: query.limit || 10,
    page: query.page || 1,
  });
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
  getEmployeesPerformance,
  getMyTasks,
  getMyTaskById,
  getMyPerformance,
};
