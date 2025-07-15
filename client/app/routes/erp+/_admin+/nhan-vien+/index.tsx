import { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import {
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  Target,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import Defer from '~/components/Defer';
import { parseAuthCookie } from '~/services/cookie.server';
import { getEmployeeDashboardOverview } from '~/services/employeeDashboard.server';
import EmployeeStatsCard from '~/components/employee/EmployeeStatsCard';
import MyTasksOverview from '~/components/employee/MyTasksOverview';
import MyAttendanceOverview from '~/components/employee/MyAttendanceOverview';
import RoleBasedSection from '~/components/employee/RoleBasedSection';
import EmployeeDashboardSkeleton from '~/components/employee/EmployeeDashboardSkeleton';
import RoleDisplay from '~/components/employee/RoleDisplay';
import { getRoleDisplayName } from '~/utils/permission';
import ContentHeader from '~/components/ContentHeader';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await parseAuthCookie(request);

  return {
    dashboardOverview: getEmployeeDashboardOverview(user!).catch((error) => {
      console.error('Error fetching employee dashboard overview:', error);
      return {
        success: false,
        message:
          'Có lỗi khi lấy thông tin tổng quan bảng điều khiển nhân viên. Vui lòng thử lại sau.',
      };
    }),
    user,
  };
};

export default function IndexHRM() {
  const { dashboardOverview, user } = useLoaderData<typeof loader>();

  const roleDisplayName = getRoleDisplayName(user?.user?.usr_role);

  return (
    <div className='space-y-4 md:space-y-6 min-h-screen'>
      {/* Content Header */}
      <ContentHeader title={`Trang chủ - ${roleDisplayName}`} />

      {/* Role Display */}
      {user?.user?.usr_role && <RoleDisplay userRole={user.user.usr_role} />}

      <Defer
        resolve={dashboardOverview}
        fallback={<EmployeeDashboardSkeleton />}
      >
        {(data) => (
          <>
            {/* Dashboard Stats */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
              <EmployeeStatsCard
                title='Chấm công tuần này'
                value={`${data.myLast7DaysAttendance.filter((a) => a.checkInTime).length}/7`}
                description='Số ngày đã chấm công trong tuần'
                icon={Clock}
                trend={{
                  value: data.stats.weeklyAttendanceRate - 85, // Assume 85% as baseline
                  isPositive: data.stats.weeklyAttendanceRate >= 85,
                  label: 'so với tuần trước',
                }}
                iconClassName='bg-blue-900/10'
              />

              <EmployeeStatsCard
                title='Công việc của tôi'
                value={data.stats.myTasksCount.toLocaleString()}
                description={`${data.stats.myCompletedTasks} hoàn thành, ${data.stats.myPendingTasks} đang làm`}
                icon={Target}
                trend={{
                  value: 5.2, // This could be calculated from historical data
                  isPositive: true,
                  label: 'so với tuần trước',
                }}
                iconClassName='bg-green-900/10'
              />

              <EmployeeStatsCard
                title='Điểm hiệu suất'
                value={`${data.stats.myPerformanceScore}/100`}
                description='Điểm hiệu suất công việc của tôi'
                icon={TrendingUp}
                trend={{
                  value: data.stats.myPerformanceScore > 75 ? 2.3 : -1.2,
                  isPositive: data.stats.myPerformanceScore > 75,
                  label: 'so với tháng trước',
                }}
                iconClassName='bg-purple-900/10'
              />

              <EmployeeStatsCard
                title='Trạng thái hôm nay'
                value={
                  data.stats.todayAttendance ? 'Đã chấm công' : 'Chưa chấm công'
                }
                description={
                  data.stats.todayAttendance
                    ? 'Đã có mặt tại công ty'
                    : 'Chưa chấm công vào làm'
                }
                icon={data.stats.todayAttendance ? CheckCircle : AlertTriangle}
                iconClassName={
                  data.stats.todayAttendance
                    ? 'bg-green-900/10'
                    : 'bg-red-900/10'
                }
              />
            </div>

            {/* Main Dashboard Content */}
            <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
              {/* My Tasks Overview - Takes 1 column */}
              <MyTasksOverview
                tasks={data.myRecentTasks}
                totalTasks={data.stats.myTasksCount}
                completedTasks={data.stats.myCompletedTasks}
                pendingTasks={data.stats.myPendingTasks}
                overdueTasks={data.stats.myOverdueTasks}
                performanceScore={data.stats.myPerformanceScore}
              />

              {/* My Attendance Overview - Takes 1 column */}
              <MyAttendanceOverview
                attendanceList={data.myLast7DaysAttendance}
                weeklyAttendanceRate={data.stats.weeklyAttendanceRate}
                todayAttendanceRecord={data.todayAttendanceRecord}
              />

              {/* Role-based Section - Takes 1 column */}
              {user?.user?.usr_role && (
                <RoleBasedSection userRole={user.user.usr_role} />
              )}
            </div>

            {/* Additional Stats Row */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <EmployeeStatsCard
                title='Công việc quá hạn'
                value={data.stats.myOverdueTasks.toLocaleString()}
                description='Công việc đã quá thời hạn'
                icon={AlertTriangle}
                iconClassName='bg-red-900/10'
              />

              <EmployeeStatsCard
                title='Tỷ lệ hoàn thành'
                value={`${data.stats.myTasksCount > 0 ? Math.round((data.stats.myCompletedTasks / data.stats.myTasksCount) * 100) : 0}%`}
                description='Tỷ lệ hoàn thành công việc'
                icon={Target}
                iconClassName='bg-green-900/10'
              />

              <EmployeeStatsCard
                title='Chấm công tháng này'
                value={`${data.stats.weeklyAttendanceRate.toFixed(1)}%`}
                description='Tỷ lệ chấm công trung bình'
                icon={Calendar}
                iconClassName='bg-blue-900/10'
              />
            </div>
          </>
        )}
      </Defer>
    </div>
  );
}
