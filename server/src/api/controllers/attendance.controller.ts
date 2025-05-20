import { Request, Response } from 'express';
import { OK } from '../core/success.response';
import * as attendanceService from '../services/attendance.service';

export class AttendanceController {
  static async generateAttendanceQR(req: Request, res: Response) {
    return OK({
      res,
      message: 'QR code generated successfully',
      metadata: await attendanceService.generateAttendanceQR(),
    });
  }

  static async checkIn(req: Request, res: Response) {
    const result = await attendanceService.checkIn(req.body);

    return OK({
      res,
      message: 'Check-in successful',
      metadata: result,
    });
  }

  static async checkOut(req: Request, res: Response) {
    const result = await attendanceService.checkOut(req.body);

    return OK({
      res,
      message: 'Check-out successful',
      metadata: result,
    });
  }

  static async getLast7DaysStats(req: Request, res: Response) {
    const result = await attendanceService.getLast7DaysStats(req.params.userId);

    return OK({
      res,
      message: 'Stats fetched successfully',
      metadata: result,
    });
  }

  static async getAttendanceStats(req: Request, res: Response) {
    const result = await attendanceService.getAttendanceStats(
      parseInt(req.query.month as string),
      parseInt(req.query.year as string)
    );

    return OK({
      res,
      message: 'Stats fetched successfully',
      metadata: result,
    });
  }

  static async getTodayAttendance(req: Request, res: Response) {
    const result = await attendanceService.getTodayAttendance(req.user.userId);

    return OK({
      res,
      message: 'Today attendance fetched successfully',
      metadata: result,
    });
  }

  static async getTodayAttendanceStats(req: Request, res: Response) {
    const result = await attendanceService.getTodayAttendanceStats();

    return OK({
      res,
      message: 'Today attendance stats fetched successfully',
      metadata: result,
    });
  }

  static async updateAttendance(req: Request, res: Response) {
    const result = await attendanceService.updateAttendance(
      req.params.attendanceId,
      req.body
    );

    return OK({
      res,
      message: 'Attendance updated successfully',
      metadata: result,
    });
  }

  static async deleteAttendance(req: Request, res: Response) {
    const result = await attendanceService.deleteAttendance(
      req.params.attendanceId
    );

    return OK({
      res,
      message: 'Attendance deleted successfully',
      metadata: result,
    });
  }
}
