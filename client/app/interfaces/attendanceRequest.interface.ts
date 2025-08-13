import { IEmployee, IEmployeeBrief } from './employee.interface';

export interface IAttendanceRequestBrief {
  id: string;
  employee: IEmployeeBrief;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  message?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IAttendanceRequest
  extends Omit<IAttendanceRequestBrief, 'employee'> {
  fingerprint: string;
  ip: string;
  employee: IEmployee;
}

export interface IAttendanceRequestCreate {
  fingerprint: string;
  ip: string;
  date: string;
  message?: string;
  checkInTime?: string;
  checkOutTime?: string;
}
