import { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useNavigate, Link } from '@remix-run/react';
import { useState } from 'react';
import {
  Trophy,
  Users,
  TrendingUp,
  Clock,
  Target,
  Calendar,
  User,
} from 'lucide-react';

import { parseAuthCookie } from '~/services/cookie.server';
import { getEmployeesPerformance } from '~/services/task.server';
import ContentHeader from '~/components/ContentHeader';
import Defer from '~/components/Defer';
import LoadingCard from '~/components/LoadingCard';
import ErrorCard from '~/components/ErrorCard';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Progress } from '~/components/ui/progress';
import { Button } from '~/components/ui/button';
import { IListColumn } from '~/interfaces/app.interface';
import List from '~/components/List';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await parseAuthCookie(request);
  const url = new URL(request.url);

  return {
    performanceData: getEmployeesPerformance(url.searchParams, user!).catch(
      (error) => {
        console.error('Error fetching performance data:', error);
        return {
          success: false,
          message: error.message || 'Có lỗi xảy ra khi lấy dữ liệu hiệu suất',
        };
      },
    ) as Promise<PerformanceData | { success: boolean; message: string }>,
  };
};

interface PerformanceEmployee {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  employeeEmail: string;
  employeeAvatar?: string;
  department: string;
  position: string;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  onTimeTasks: number;
  completionRate: number;
  onTimeRate: number;
  overdueRate: number;
  performanceScore: number;
  adminAssignedScore: number;
  averagePriorityScore: number;
  rank?: number; // Add rank field
}

interface PerformanceData {
  data: PerformanceEmployee[];
  summary: {
    totalEmployees: number;
    averageCompletionRate: number;
    averageOnTimeRate: number;
    averagePerformanceScore: number;
    totalTasksProcessed: number;
    totalCompletedTasks: number;
    totalOverdueTasks: number;
    periodStart: string;
    periodEnd: string;
  };
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function TaskPerformancePage() {
  const { performanceData } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const [performanceColumns, setPerformanceColumns] = useState<
    IListColumn<PerformanceEmployee>[]
  >([
    {
      key: 'rank',
      title: 'Hạng',
      visible: true,
      render: (employee) => (
        <div className='font-bold text-base sm:text-lg transition-all duration-500 animate-pulse cursor-default'>
          {getRankIcon((employee.rank || 1) - 1)}
        </div>
      ),
    },
    {
      key: 'employeeName',
      title: 'Nhân viên',
      visible: true,
      sortField: 'employeeName',
      render: (employee) => (
        <div className='flex items-center space-x-2 sm:space-x-3 group'>
          <Avatar className='h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg'>
            <AvatarImage
              src={employee.employeeAvatar}
              alt={employee.employeeName}
            />
            <AvatarFallback className='bg-red-900/10 text-red-900 font-semibold text-xs transition-all duration-300 group-hover:bg-red-900/20 group-hover:text-red-800'>
              {employee.employeeName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className='min-w-0 flex-1'>
            <Link
              prefetch='intent'
              to={`/erp/employees/${employee.employeeId}`}
              className='font-semibold text-sm sm:text-base text-gray-900 hover:text-red-900 transition-all duration-200 block truncate hover:scale-105 transform-gpu'
            >
              {employee.employeeName}
            </Link>
            <p className='text-sm sm:text-base text-gray-600 truncate transition-colors duration-200 group-hover:text-gray-700'>
              {employee.employeeCode} • {employee.department}
            </p>
            <p className='text-xs text-gray-500 truncate hidden sm:block transition-colors duration-200 group-hover:text-gray-600'>
              {employee.position}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'performanceScore',
      title: 'Điểm hiệu suất',
      visible: true,
      sortField: 'performanceScore',
      render: (employee) => (
        <div className=''>
          <Badge
            className={`${getPerformanceColor(
              employee.performanceScore,
            )} font-bold text-sm sm:text-base px-2 sm:px-3 py-1 transition-all duration-200 hover:scale-110 hover:shadow-md cursor-default`}
          >
            {Math.round(employee.performanceScore)}
          </Badge>
        </div>
      ),
    },
    {
      key: 'completionRate',
      title: 'Tỷ lệ hoàn thành',
      visible: true,
      sortField: 'completionRate',
      render: (employee) => (
        <div className='flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 group'>
          <div>
            <p className='text-sm sm:text-base font-semibold mb-1 transition-colors duration-200 group-hover:text-primary'>
              {employee.completedTasks}/{employee.totalTasks}
            </p>
            <p className='text-xs text-gray-500 transition-colors duration-200 group-hover:text-gray-600'>
              {Math.round(employee.completionRate)}%
            </p>
          </div>
          <div className='w-16 sm:w-20'>
            <Progress
              value={employee.completionRate}
              className='h-1.5 sm:h-2 transition-all duration-300 group-hover:h-2 sm:group-hover:h-2.5'
            />
          </div>
        </div>
      ),
    },
    {
      key: 'onTimeRate',
      title: 'Tỷ lệ đúng hạn',
      visible: true,
      sortField: 'onTimeRate',
      render: (employee) => (
        <div className='space-x-1 group'>
          <span className='text-sm sm:text-base font-semibold text-green-600 transition-all duration-200 group-hover:text-green-500 group-hover:scale-105'>
            {Math.round(employee.onTimeRate)}%
          </span>
        </div>
      ),
    },
    {
      key: 'overdueTasks',
      title: 'Quá hạn',
      visible: true,
      sortField: 'overdueTasks',
      render: (employee) => (
        <div className='space-x-1 group'>
          <span className='text-sm sm:text-base font-semibold text-red-600 transition-all duration-200 group-hover:text-red-500 group-hover:scale-105'>
            {employee.overdueTasks}
          </span>
          <span className='text-xs text-gray-500 hidden sm:inline transition-colors duration-200 group-hover:text-gray-600'>
            task
          </span>
        </div>
      ),
    },
    {
      key: 'adminAssignedScore',
      title: 'Điểm',
      visible: true,
      render: (employee) => (
        <div className=''>
          <Badge
            className={`${getPerformanceColor(
              employee.adminAssignedScore,
            )} font-bold text-sm sm:text-base px-2 sm:px-3 py-1 transition-all duration-200 hover:scale-110 hover:shadow-md cursor-default`}
          >
            {Math.round(employee.adminAssignedScore)}
          </Badge>
        </div>
      ),
    },
  ]);

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  return (
    <div className='space-y-4 sm:space-y-6 min-h-screen mx-auto animate-in fade-in-0 duration-500'>
      {/* Content Header */}
      <div className='animate-in slide-in-from-top-4 duration-500'>
        <ContentHeader
          title='Hiệu suất nhân viên'
          backHandler={() => navigate('..')}
        />
      </div>

      <Defer resolve={performanceData} fallback={<LoadingCard />}>
        {(data) => {
          return (
            <>
              {/* Summary Statistics */}
              <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 animate-in slide-in-from-bottom-4 duration-600 delay-100'>
                <div className='animate-in slide-in-from-left-3 duration-500 delay-200'>
                  <Card className='transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1 group'>
                    <CardContent className='p-4 sm:p-6'>
                      <div className='flex items-center'>
                        <Users className='h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:text-blue-500' />
                        <div className='ml-3 sm:ml-4 min-w-0'>
                          <p className='text-sm sm:text-base font-medium text-gray-600 transition-colors duration-200 group-hover:text-primary'>
                            Tổng nhân viên
                          </p>
                          <p className='text-xl sm:text-2xl font-bold text-gray-900 transition-all duration-300 group-hover:text-primary group-hover:scale-105'>
                            {data.summary.totalEmployees}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className='animate-in slide-in-from-left-3 duration-500 delay-300'>
                  <Card className='transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1 group'>
                    <CardContent className='p-4 sm:p-6'>
                      <div className='flex items-center'>
                        <Target className='h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:text-green-500' />
                        <div className='ml-3 sm:ml-4 min-w-0'>
                          <p className='text-sm sm:text-base font-medium text-gray-600 transition-colors duration-200 group-hover:text-primary'>
                            Tỷ lệ hoàn thành TB
                          </p>
                          <p className='text-xl sm:text-2xl font-bold text-gray-900 transition-all duration-300 group-hover:text-primary group-hover:scale-105'>
                            {Math.round(data.summary.averageCompletionRate)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className='animate-in slide-in-from-left-3 duration-500 delay-400'>
                  <Card className='transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1 group'>
                    <CardContent className='p-4 sm:p-6'>
                      <div className='flex items-center'>
                        <Clock className='h-6 w-6 sm:h-8 sm:w-8 text-orange-600 flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:text-orange-500' />
                        <div className='ml-3 sm:ml-4 min-w-0'>
                          <p className='text-sm sm:text-base font-medium text-gray-600 transition-colors duration-200 group-hover:text-primary'>
                            Tỷ lệ đúng hạn TB
                          </p>
                          <p className='text-xl sm:text-2xl font-bold text-gray-900 transition-all duration-300 group-hover:text-primary group-hover:scale-105'>
                            {Math.round(data.summary.averageOnTimeRate)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className='animate-in slide-in-from-left-3 duration-500 delay-500'>
                  <Card className='transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1 group'>
                    <CardContent className='p-4 sm:p-6'>
                      <div className='flex items-center'>
                        <TrendingUp className='h-6 w-6 sm:h-8 sm:w-8 text-purple-600 flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:text-purple-500' />
                        <div className='ml-3 sm:ml-4 min-w-0'>
                          <p className='text-sm sm:text-base font-medium text-gray-600 transition-colors duration-200 group-hover:text-primary'>
                            Điểm hiệu suất TB
                          </p>
                          <p className='text-xl sm:text-2xl font-bold text-gray-900 transition-all duration-300 group-hover:text-primary group-hover:scale-105'>
                            {Math.round(data.summary.averagePerformanceScore)}
                            /100
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Performance Leaderboard */}
              <div className='animate-in slide-in-from-bottom-3 duration-600 delay-300'>
                <Card className='transition-all duration-300 hover:shadow-xl'>
                  <CardHeader className='p-4 sm:p-6 animate-in slide-in-from-top-2 duration-400 delay-600'>
                    <CardTitle className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0'>
                      <div className='flex items-center group'>
                        <Trophy className='w-4 h-4 sm:w-5 sm:h-5 mr-2 text-yellow-600 flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 animate-bounce-gentle' />
                        <span className='text-sm sm:text-base font-bold transition-colors duration-200 group-hover:text-primary'>
                          Bảng xếp hạng hiệu suất
                        </span>
                      </div>
                      <Badge
                        variant='outline'
                        className='text-sm sm:text-base transition-all duration-200 hover:scale-105 animate-in slide-in-from-right-2 duration-300 delay-700'
                      >
                        {data.pagination.total} nhân viên
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='p-0 animate-in fade-in-0 duration-500 delay-700'>
                    <List<PerformanceEmployee>
                      itemsPromise={{
                        data: data.data.map((employee, index) => ({
                          ...employee,
                          rank:
                            (data.pagination.page - 1) * data.pagination.limit +
                            index +
                            1,
                        })),
                        pagination: data.pagination,
                        success: true,
                      }}
                      visibleColumns={performanceColumns}
                      setVisibleColumns={setPerformanceColumns}
                      name='nhân viên'
                      showToolbar={false}
                      showPagination={true}
                      deleteHandleRoute='/erp/employees'
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Performance Period Info */}
              {data.summary.periodStart && data.summary.periodEnd && (
                <div className='animate-in slide-in-from-bottom-2 duration-500 delay-800'>
                  <Card className='transition-all duration-300 hover:shadow-md hover:scale-[1.01] group'>
                    <CardContent className='p-3 sm:p-4'>
                      <div className='flex items-center justify-center text-sm sm:text-base text-gray-600'>
                        <Calendar className='w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:text-primary' />
                        <span className='text-center transition-colors duration-200 group-hover:text-primary'>
                          Dữ liệu từ{' '}
                          {new Date(
                            data.summary.periodStart,
                          ).toLocaleDateString('vi-VN')}{' '}
                          đến{' '}
                          {new Date(data.summary.periodEnd).toLocaleDateString(
                            'vi-VN',
                          )}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          );
        }}
      </Defer>
    </div>
  );
}
