import { ISessionUser } from '~/interfaces/auth.interface';
import { ITask } from '~/interfaces/task.interface';
import { IAttendance } from '~/interfaces/attendance.interface';
import { getEmployeesPerformance, getMyTasks, getTasks } from './task.server';
import { getEmployees } from './employee.server';
import { getTodayAttendanceStats } from './attendance.server';

export interface IDashboardStats {
  totalEmployees: number;
  attendanceRate: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  averagePerformanceScore: number;
  todayCheckIns: number;
  monthlyAttendanceRate: number;
}

export interface IDashboardPerformance {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  position: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  performanceScore: number;
  attendanceRate: number;
}

export interface IDashboardOverview {
  stats: IDashboardStats;
  recentTasks: ITask[];
  topPerformers: IDashboardPerformance[];
  recentAttendance: IAttendance[];
}

// Get dashboard overview statistics
const getDashboardStats = async (
  request: ISessionUser,
): Promise<IDashboardStats> => {
  try {
    // Lấy số lượng nhân viên
    const employeesResponse = await getEmployees(
      new URLSearchParams([['limit', '1']]),
      request,
    );

    // Lấy thống kê công việc
    const tasksResponse = await getMyTasks(
      new URLSearchParams([['limit', '1']]),
      request,
    );

    // Lấy dữ liệu hiệu suất công việc
    const performanceResponse = await getEmployeesPerformance(
      new URLSearchParams([['limit', '1']]),
      request,
    );

    // Lấy thống kê chấm công hôm nay
    const attendanceResponse = await getTodayAttendanceStats(request);

    // Tính toán thống kê cơ bản
    const totalEmployees = employeesResponse.pagination?.total || 0;
    const totalTasks = tasksResponse.pagination?.total || 0;
    const todayCheckIns = attendanceResponse.length || 0;

    // Tính tỷ lệ chấm công (ví dụ: dựa trên check-in hôm nay so với tổng nhân viên)
    const attendanceRate =
      totalEmployees > 0 ? (todayCheckIns / totalEmployees) * 100 : 0;

    // Lấy số liệu hiệu suất từ dịch vụ công việc
    const performanceStats = performanceResponse.summary || {};

    return {
      totalEmployees,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
      totalTasks,
      completedTasks: performanceStats.totalCompletedTasks || 0,
      pendingTasks: totalTasks - (performanceStats.totalCompletedTasks || 0),
      overdueTasks: performanceStats.totalOverdueTasks || 0,
      averagePerformanceScore:
        Math.round((performanceStats.averagePerformanceScore || 0) * 100) / 100,
      todayCheckIns,
      monthlyAttendanceRate: Math.round(attendanceRate * 100) / 100, // Đây nên được tính từ dữ liệu hàng tháng
    };
  } catch (error) {
    console.error('Lỗi khi lấy thống kê dashboard:', error);
    return {
      totalEmployees: 0,
      attendanceRate: 0,
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      overdueTasks: 0,
      averagePerformanceScore: 0,
      todayCheckIns: 0,
      monthlyAttendanceRate: 0,
    };
  }
};

// Get dashboard overview (combines all dashboard data)
const getDashboardOverview = async (
  request: ISessionUser,
): Promise<IDashboardOverview> => {
  try {
    const [
      stats,
      recentTasksResponse,
      performanceResponse,
      attendanceResponse,
    ] = await Promise.allSettled([
      getDashboardStats(request),
      getTasks(
        new URLSearchParams({
          limit: '5',
          sortBy: 'performanceScore',
          sortOrder: 'desc',
        }),
        request,
      ),
      getEmployeesPerformance(
        new URLSearchParams({
          limit: '5',
          sortBy: 'performanceScore',
          sortOrder: 'desc',
        }),
        request,
      ),
      getTodayAttendanceStats(request),
    ]);

    return {
      stats:
        stats.status === 'fulfilled'
          ? stats.value
          : {
              totalEmployees: 0,
              attendanceRate: 0,
              totalTasks: 0,
              completedTasks: 0,
              pendingTasks: 0,
              overdueTasks: 0,
              averagePerformanceScore: 0,
              todayCheckIns: 0,
              monthlyAttendanceRate: 0,
            },
      recentTasks:
        recentTasksResponse.status === 'fulfilled'
          ? recentTasksResponse.value.data
          : [],
      topPerformers:
        performanceResponse.status === 'fulfilled'
          ? performanceResponse.value.data.map((item: any) => ({
              employeeId: item.employeeId,
              employeeName: item.employeeName,
              employeeCode: item.employeeCode,
              department: item.department,
              position: item.position,
              totalTasks: item.totalTasks,
              completedTasks: item.completedTasks,
              completionRate: item.completionRate,
              performanceScore: item.performanceScore,
              attendanceRate: 95, // Đây nên đến từ dịch vụ chấm công
            }))
          : [],
      recentAttendance:
        attendanceResponse.status === 'fulfilled'
          ? attendanceResponse.value
          : [],
    };
  } catch (error) {
    console.error('Lỗi khi lấy tổng quan dashboard:', error);
    throw error;
  }
};

export { getDashboardStats, getDashboardOverview };
