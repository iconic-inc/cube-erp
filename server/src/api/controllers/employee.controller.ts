import { Request, Response } from 'express';
import { OK } from '../core/success.response';
import * as employeeService from '../services/employee.service';

export class EmployeeController {
  static async createEmployee(req: Request, res: Response) {
    const result = await employeeService.createEmployee(req.body);
    return OK({
      res,
      message: 'Employee and user created successfully',
      metadata: result,
    });
  }

  static async getEmployees(req: Request, res: Response) {
    const employees = await employeeService.getEmployees(req.query);

    return OK({
      res,
      message: 'Employees retrieved successfully',
      metadata: employees,
    });
  }

  static async getEmployeeById(req: Request, res: Response) {
    try {
      const employeeId = req.params.id;

      // Lấy thông tin employee
      const employee = await employeeService.getEmployeeById(employeeId);

      return OK({
        res,
        message: 'Employee retrieved successfully',
        metadata: employee,
      });
    } catch (error) {
      throw error;
    }
  }

  static async getEmployeeByUserId(req: Request, res: Response) {
    try {
      const targetUserId = req.params.userId;

      const employee = await employeeService.getEmployeeByUserId(targetUserId);

      return OK({
        res,
        message: 'Employee retrieved successfully',
        metadata: employee,
      });
    } catch (error) {
      throw error;
    }
  }

  static async getCurrentEmployeeByUserId(req: Request, res: Response) {
    const employee = await employeeService.getCurrentEmployeeByUserId(
      req.user.userId
    );
    return OK({
      res,
      message: 'Employee retrieved successfully',
      metadata: employee,
    });
  }

  static async updateEmployee(req: Request, res: Response) {
    const employeeId = req.params.id;
    const result = await employeeService.updateEmployee(employeeId, req.body);

    return OK({
      res,
      message: 'Employee updated successfully',
      metadata: result,
    });
  }

  static async updateCurrentEmployee(req: Request, res: Response) {
    const employee = await employeeService.getCurrentEmployeeByUserId(
      req.user.userId
    );
    const result = await employeeService.updateEmployee(employee.id, req.body);
    return OK({
      res,
      message: 'Employee updated successfully',
      metadata: result,
    });
  }

  static async deleteEmployee(req: Request, res: Response) {
    try {
      const employeeId = req.params.id;
      const result = await employeeService.deleteEmployee(employeeId);

      return OK({
        res,
        message: 'Employee deleted successfully',
        metadata: result,
      });
    } catch (error) {
      throw error;
    }
  }

  static async bulkDeleteEmployees(req: Request, res: Response) {
    try {
      const employeeIds = req.body.employeeIds;
      const result = await employeeService.bulkDeleteEmployees(employeeIds);

      return OK({
        res,
        message: 'Employees deleted successfully',
        metadata: result,
      });
    } catch (error) {
      throw error;
    }
  }

  static async exportEmployeesToCSV(req: Request, res: Response) {
    try {
      const result = await employeeService.exportEmployeesToCSV(req.query);

      return OK({
        res,
        message: 'Employees exported to CSV successfully',
        metadata: result,
      });
    } catch (error) {
      throw error;
    }
  }

  static async exportEmployeesToXLSX(req: Request, res: Response) {
    try {
      const result = await employeeService.exportEmployeesToXLSX(req.query);

      return OK({
        res,
        message: 'Employees exported to XLSX successfully',
        metadata: result,
      });
    } catch (error) {
      throw error;
    }
  }
}
