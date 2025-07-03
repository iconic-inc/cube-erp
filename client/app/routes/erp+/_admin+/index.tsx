import { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import {
  Plus,
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  Target,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import Defer from '~/components/Defer';
import ContentHeader from '~/components/ContentHeader';
import { parseAuthCookie } from '~/services/cookie.server';
import { getDashboardOverview } from '~/services/dashboard.server';
import StatsCard from '~/components/dashboard/StatsCard';
import PerformanceOverview from '~/components/dashboard/PerformanceOverview';
import RecentTasks from '~/components/dashboard/RecentTasks';
import AttendanceOverview from '~/components/dashboard/AttendanceOverview';
import DashboardSkeleton from '~/components/dashboard/DashboardSkeleton';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await parseAuthCookie(request);

  return {
    dashboardOverview: getDashboardOverview(user!).catch((error) => {
      console.error('Error fetching dashboard overview:', error);
      return {
        stats: {
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
        recentTasks: [],
        topPerformers: [],
        recentAttendance: [],
      };
    }),
  };
};

export default function IndexHRM() {
  const { dashboardOverview } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <div className='space-y-8 p-6 bg-background min-h-screen'>
      {/* Content Header */}
      <ContentHeader
        title='Bảng điều khiển'
        actionContent={
          <>
            <Plus className='w-4 h-4 mr-2' />
            Thêm nhân viên
          </>
        }
        actionHandler={() => navigate('/erp/employees/new')}
      />

      <Defer resolve={dashboardOverview} fallback={<DashboardSkeleton />}>
        {(data) => (
          <>
            {/* Dashboard Stats */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
              <StatsCard
                title='Tổng nhân viên'
                value={data.stats.totalEmployees.toLocaleString()}
                description='Nhân viên đang hoạt động trong hệ thống'
                icon={Users}
                trend={{
                  value: 8.2,
                  isPositive: true,
                  label: 'so với tháng trước',
                }}
                iconClassName='bg-red-900/10'
              />

              <StatsCard
                title='Tỷ lệ chấm công'
                value={`${data.stats.attendanceRate}%`}
                description='Tỷ lệ chấm công hôm nay'
                icon={CheckCircle}
                trend={{
                  value: 2.1,
                  isPositive: true,
                  label: 'so với hôm qua',
                }}
                iconClassName='bg-red-900/10'
              />

              <StatsCard
                title='Công việc đang thực hiện'
                value={data.stats.totalTasks.toLocaleString()}
                description={`${data.stats.completedTasks} hoàn thành, ${data.stats.pendingTasks} đang chờ`}
                icon={Target}
                trend={{
                  value: 12.5,
                  isPositive: true,
                  label: 'so với tuần trước',
                }}
                iconClassName='bg-red-900/10'
              />

              <StatsCard
                title='Điểm hiệu suất'
                value={`${data.stats.averagePerformanceScore}/100`}
                description='Hiệu suất trung bình của đội nhóm'
                icon={TrendingUp}
                trend={{
                  value: 4.3,
                  isPositive: true,
                  label: 'so với tháng trước',
                }}
                iconClassName='bg-red-900/10'
              />
            </div>

            {/* Main Dashboard Content */}
            <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
              {/* Performance Overview - Takes 1 column */}
              <PerformanceOverview performers={data.topPerformers} />

              {/* Recent Tasks - Takes 1 column */}
              <RecentTasks tasks={data.recentTasks} />

              {/* Attendance Overview - Takes 1 column */}
              <AttendanceOverview
                attendanceList={data.recentAttendance}
                totalEmployees={data.stats.totalEmployees}
                attendanceRate={data.stats.attendanceRate}
              />
            </div>

            {/* Additional Stats Row */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <StatsCard
                title='Chấm công hôm nay'
                value={data.stats.todayCheckIns.toLocaleString()}
                description='Nhân viên đã chấm công hôm nay'
                icon={Clock}
                iconClassName='bg-red-900/10'
              />

              <StatsCard
                title='Công việc quá hạn'
                value={data.stats.overdueTasks.toLocaleString()}
                description='Công việc đã quá thời hạn'
                icon={AlertTriangle}
                iconClassName='bg-red-900/10'
              />

              <StatsCard
                title='Chấm công theo tháng'
                value={`${data.stats.monthlyAttendanceRate}%`}
                description='Trung bình tháng này'
                icon={Calendar}
                iconClassName='bg-red-900/10'
              />
            </div>
          </>
        )}
      </Defer>
    </div>
  );
}
