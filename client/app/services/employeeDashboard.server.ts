import { ISessionUser } from '~/interfaces/auth.interface';
import { IAttendanceBrief } from '~/interfaces/attendance.interface';
import { ITask } from '~/interfaces/task.interface';
import { getMyTaskPerformance, getMyTasks } from './task.server';
import {
  getLast7DaysStatsForEmployee,
  getTodayAttendanceForEmployee,
} from './attendance.server';

export interface IEmployeeDashboardStats {
  myAttendanceRate: number;
  myTasksCount: number;
  myCompletedTasks: number;
  myPendingTasks: number;
  myOverdueTasks: number;
  myPerformanceScore: number;
  todayAttendance: boolean;
  weeklyAttendanceRate: number;
}

export interface IEmployeeDashboardOverview {
  stats: IEmployeeDashboardStats;
  myRecentTasks: ITask[];
  myLast7DaysAttendance: IAttendanceBrief[];
  todayAttendanceRecord?: IAttendanceBrief;
}

// Get employee dashboard statistics
const getEmployeeDashboardStats = async (
  request: ISessionUser,
): Promise<IEmployeeDashboardStats> => {
  try {
    const [
      myTasksResponse,
      myPerformanceResponse,
      myAttendanceResponse,
      todayAttendanceResponse,
    ] = await Promise.all([
      getMyTasks(
        new URLSearchParams([
          ['limit', '1'],
          ['page', '1'],
        ]),
        request,
      ),
      getMyTaskPerformance(
        new URLSearchParams([
          ['limit', '1'],
          ['page', '1'],
        ]),
        request,
      ),
      getLast7DaysStatsForEmployee(request),
      getTodayAttendanceForEmployee(request),
    ]);

    // Calculate statistics
    const myTasksCount = myTasksResponse.pagination?.total || 0;
    const myPerformanceData = myPerformanceResponse.data?.[0];
    const myCompletedTasks = myPerformanceData?.completedTasks || 0;
    const myOverdueTasks = myPerformanceData?.overdueTasks || 0;
    const myPendingTasks = myTasksCount - myCompletedTasks;
    const myPerformanceScore =
      Math.round((myPerformanceData?.performanceScore || 0) * 100) / 100;

    // Calculate attendance statistics
    const myLast7Days = myAttendanceResponse || [];
    const attendedDays = myLast7Days.filter((att) => att.checkInTime).length;
    const weeklyAttendanceRate =
      myLast7Days.length > 0 ? (attendedDays / 7) * 100 : 0;
    const todayAttendance = !!todayAttendanceResponse?.checkInTime;

    return {
      myAttendanceRate: weeklyAttendanceRate,
      myTasksCount,
      myCompletedTasks,
      myPendingTasks,
      myOverdueTasks,
      myPerformanceScore,
      todayAttendance,
      weeklyAttendanceRate: Math.round(weeklyAttendanceRate * 100) / 100,
    };
  } catch (error) {
    console.error('Error fetching employee dashboard stats:', error);
    return {
      myAttendanceRate: 0,
      myTasksCount: 0,
      myCompletedTasks: 0,
      myPendingTasks: 0,
      myOverdueTasks: 0,
      myPerformanceScore: 0,
      todayAttendance: false,
      weeklyAttendanceRate: 0,
    };
  }
};

// Get employee dashboard overview (combines all dashboard data)
const getEmployeeDashboardOverview = async (
  request: ISessionUser,
): Promise<IEmployeeDashboardOverview> => {
  try {
    const [
      stats,
      myRecentTasksResponse,
      myAttendanceResponse,
      todayAttendanceResponse,
    ] = await Promise.allSettled([
      getEmployeeDashboardStats(request),
      getMyTasks(
        new URLSearchParams([
          ['limit', '5'],
          ['page', '1'],
        ]),
        request,
      ).catch((error) => {
        console.error('Error fetching my tasks:', error);
        return { data: [], pagination: { total: 0 } };
      }),
      getLast7DaysStatsForEmployee(request),
      getTodayAttendanceForEmployee(request),
    ]);

    return {
      stats:
        stats.status === 'fulfilled'
          ? stats.value
          : {
              myAttendanceRate: 0,
              myTasksCount: 0,
              myCompletedTasks: 0,
              myPendingTasks: 0,
              myOverdueTasks: 0,
              myPerformanceScore: 0,
              todayAttendance: false,
              weeklyAttendanceRate: 0,
            },
      myRecentTasks:
        myRecentTasksResponse.status === 'fulfilled'
          ? myRecentTasksResponse.value.data
          : [],
      myLast7DaysAttendance:
        myAttendanceResponse.status === 'fulfilled'
          ? myAttendanceResponse.value
          : [],
      todayAttendanceRecord:
        todayAttendanceResponse.status === 'fulfilled'
          ? todayAttendanceResponse.value
          : undefined,
    };
  } catch (error) {
    console.error('Error fetching employee dashboard overview:', error);
    throw error;
  }
};

export { getEmployeeDashboardStats, getEmployeeDashboardOverview };
