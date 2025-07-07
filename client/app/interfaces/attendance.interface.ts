import { IEmployee, IEmployeeBrief } from './employee.interface';

export interface IAttendanceBrief {
  id: string;
  employee: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IAttendance extends Omit<IAttendanceBrief, 'employee'> {
  fingerprint: string;
  ip: string;
  employee: IEmployee;
}

export interface IAttendanceStats {
  _id: string;
  totalDays: number;
  lateCount: number;
}

export interface IAttendanceCreate {
  fingerprint: string;
  ip: string;
}
