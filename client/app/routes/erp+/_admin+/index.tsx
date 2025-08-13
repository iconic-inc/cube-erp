import { LoaderFunctionArgs, redirect } from '@remix-run/node';
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
import { isAdmin } from '~/utils/permission';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await parseAuthCookie(request);

  if (!isAdmin(user?.user.usr_role)) {
    return redirect('/erp/nhan-vien');
  }

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
    <div className='space-y-4 md:space-y-6 min-h-screen p-1 sm:p-0'>
      {/* Content Header */}
      <div className='mb-4 md:mb-6'>
        <ContentHeader
          title='Bảng điều khiển'
          actionContent={
            <>
              <Plus className='w-4 h-4' />
              <span className='sm:text-sm sm:inline'>Thêm Task</span>
            </>
          }
          actionHandler={() => navigate('/erp/tasks/new')}
        />
      </div>

      <Defer resolve={dashboardOverview} fallback={<DashboardSkeleton />}>
        {(data) => (
          <div className='space-y-4 md:space-y-6'>
            {/* Dashboard Stats - Responsive Grid */}
            <div className='grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6'>
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
                className='col-span-1'
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
                className='col-span-1'
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
                className='col-span-1 xs:col-span-2 lg:col-span-1'
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
                className='col-span-1 xs:col-span-2 lg:col-span-1'
              />
            </div>

            {/* Main Dashboard Content - Responsive Grid */}
            <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6'>
              {/* Performance Overview */}
              <div className='col-span-1 lg:col-span-1 xl:col-span-1'>
                <PerformanceOverview performers={data.topPerformers} />
              </div>

              {/* Recent Tasks */}
              <div className='col-span-1 lg:col-span-1 xl:col-span-1'>
                <RecentTasks tasks={data.recentTasks} />
              </div>

              {/* Attendance Overview */}
              <div className='col-span-1 lg:col-span-2 xl:col-span-1'>
                <AttendanceOverview
                  attendanceList={data.recentAttendance}
                  totalEmployees={data.stats.totalEmployees}
                  attendanceRate={data.stats.attendanceRate}
                />
              </div>
            </div>

            {/* Additional Stats Row - Responsive Grid */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6'>
              <StatsCard
                title='Chấm công hôm nay'
                value={data.stats.todayCheckIns.toLocaleString()}
                description='Nhân viên đã chấm công hôm nay'
                icon={Clock}
                iconClassName='bg-red-900/10'
                className='col-span-1'
              />

              <StatsCard
                title='Công việc quá hạn'
                value={data.stats.overdueTasks.toLocaleString()}
                description='Công việc đã quá thời hạn'
                icon={AlertTriangle}
                iconClassName='bg-red-900/10'
                className='col-span-1'
              />

              <StatsCard
                title='Chấm công theo tháng'
                value={`${data.stats.monthlyAttendanceRate}%`}
                description='Trung bình tháng này'
                icon={Calendar}
                iconClassName='bg-red-900/10'
                className='col-span-1 sm:col-span-2 lg:col-span-1'
              />
            </div>
          </div>
        )}
      </Defer>
    </div>
  );
}
