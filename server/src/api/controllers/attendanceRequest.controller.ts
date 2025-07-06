import { Request, Response } from 'express';
import { OK } from '../core/success.response';
import * as attendanceRequestService from '../services/attendanceRequest.service';

export class AttendanceRequestController {
  static async getEmployeeAttendanceRequests(req: Request, res: Response) {
    const { employeeId } = req.params;
    const result = await attendanceRequestService.getAttendanceRequests(
      employeeId
    );

    return OK({
      res,
      message: 'Employee attendance requests fetched successfully',
      metadata: result,
    });
  }

  static async getAttendanceRequestById(req: Request, res: Response) {
    const { requestId } = req.params;
    const result = await attendanceRequestService.getAttendanceRequestById(
      requestId
    );

    return OK({
      res,
      message: 'Attendance request fetched successfully',
      metadata: result,
    });
  }

  static async getAttendanceRequests(req: Request, res: Response) {
    const result = await attendanceRequestService.getAttendanceRequests();

    return OK({
      res,
      message: 'Attendance requests fetched successfully',
      metadata: result,
    });
  }

  static async acceptAttendanceRequest(req: Request, res: Response) {
    const { requestId } = req.params;
    const result = await attendanceRequestService.acceptAttendanceRequest(
      requestId
    );

    return OK({
      res,
      message: 'Attendance request accepted successfully',
      metadata: result,
    });
  }

  static async rejectAttendanceRequest(req: Request, res: Response) {
    const { requestId } = req.params;
    const result = await attendanceRequestService.rejectAttendanceRequest(
      requestId
    );

    return OK({
      res,
      message: 'Attendance request rejected successfully',
      metadata: result,
    });
  }

  static async createAttendanceRequest(req: Request, res: Response) {
    const userId = req.user.userId;
    const data = req.body;
    const result = await attendanceRequestService.createAttendanceRequest(
      userId,
      data
    );

    return OK({
      res,
      message: 'Attendance request created successfully',
      metadata: result,
    });
  }

  static async getMyAttendanceRequests(req: Request, res: Response) {
    const userId = req.user.userId;
    const result = await attendanceRequestService.getMyAttendanceRequests(
      userId
    );

    return OK({
      res,
      message: 'My attendance requests fetched successfully',
      metadata: result,
    });
  }

  static async getMyAttendanceRequestById(req: Request, res: Response) {
    const { requestId } = req.params;
    const result = await attendanceRequestService.getAttendanceRequestById(
      requestId
    );

    return OK({
      res,
      message: 'My attendance request fetched successfully',
      metadata: result,
    });
  }
}
