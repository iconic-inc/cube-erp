import { Request, Response } from 'express';
import { OK } from '../core/success.response';
import * as taskService from '../services/task.service';
import {
  taskCreateSchema,
  taskQuerySchema,
  taskUpdateSchema,
} from '../schemas/task.schema';
import { ITaskCreate, ITaskUpdate } from '../interfaces/task.interface';

export class TaskController {
  // Create new Task
  static async createTask(req: Request, res: Response) {
    const validatedData = taskCreateSchema.parse(req.body) as ITaskCreate;
    const result = await taskService.createTask(validatedData);
    return OK({
      res,
      message: 'Tạo Task thành công',
      metadata: result,
    });
  }

  // Get all Tasks
  static async getTasks(req: Request, res: Response) {
    const validatedQuery = taskQuerySchema.parse(req.query);
    const tasks = await taskService.getTasks(validatedQuery);
    return OK({
      res,
      message: 'Lấy danh sách Task thành công',
      metadata: tasks,
    });
  }

  // Get Task by ID
  static async getTaskById(req: Request, res: Response) {
    const { id } = req.params;
    const task = await taskService.getTaskById(id);
    return OK({
      res,
      message: 'Lấy thông tin Task thành công',
      metadata: task,
    });
  }

  static async getMyTaskById(req: Request, res: Response) {
    const { taskId } = req.params;
    const task = await taskService.getMyTaskById(req.user.userId, taskId);
    return OK({
      res,
      message: 'Lấy thông tin Task của bạn thành công',
      metadata: task,
    });
  }

  // Update Task
  static async updateTask(req: Request, res: Response) {
    const { id } = req.params;
    const validatedData = taskUpdateSchema.parse(req.body) as ITaskUpdate;
    const task = await taskService.updateTask(id, validatedData);
    return OK({
      res,
      message: 'Cập nhật Task thành công',
      metadata: task,
    });
  }

  // Delete Task
  static async deleteTask(req: Request, res: Response) {
    const { id } = req.params;
    const result = await taskService.deleteTask(id);
    return OK({
      res,
      message: 'Xóa Task thành công',
      metadata: result,
    });
  }

  // Bulk Delete Tasks
  static async bulkDeleteTasks(req: Request, res: Response) {
    const { taskIds } = req.body;
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return OK({
        res,
        message: 'Không có Task để xóa',
        metadata: {
          success: false,
          message: 'Vui lòng chọn ít nhất một Task để xóa',
        },
      });
    }

    const result = await taskService.bulkDeleteTasks(taskIds);
    return OK({
      res,
      message: 'Xóa nhiều Task thành công',
      metadata: result,
    });
  }

  // Export Tasks
  static async exportTasks(req: Request, res: Response) {
    const { fileType } = req.params;
    if (!['csv', 'xlsx'].includes(fileType)) {
      return OK({
        res,
        message: 'Định dạng file không hợp lệ',
        metadata: {
          success: false,
          message: 'Định dạng file phải là csv hoặc xlsx',
        },
      });
    }

    const validatedQuery = taskQuerySchema.parse(req.query);
    const result = await taskService.exportTasks(
      validatedQuery,
      fileType as 'csv' | 'xlsx'
    );

    return OK({
      res,
      message: 'Xuất danh sách Task thành công',
      metadata: result,
    });
  }

  // Get Tasks assigned to current user
  static async getMyTasks(req: Request, res: Response) {
    return OK({
      res,
      message: 'Lấy danh sách Task của bạn thành công',
      metadata: await taskService.getMyTasks(req.user.userId, req.query),
    });
  }

  static async getMyPerformance(req: Request, res: Response) {
    return OK({
      res,
      message: 'Lấy hiệu suất công việc của bạn thành công',
      metadata: await taskService.getMyPerformance(req.user.userId, req.query),
    });
  }

  static async getEmployeesPerformance(req: Request, res: Response) {
    const performanceData = await taskService.getEmployeesPerformance(
      req.query
    );
    return OK({
      res,
      message: 'Lấy hiệu suất nhân viên thành công',
      metadata: performanceData,
    });
  }
}
