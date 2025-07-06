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

  // Get query parameters
  const page = Number(url.searchParams.get('page')) || 1;
  const limit = Number(url.searchParams.get('limit')) || 20;
  const sortBy = url.searchParams.get('sortBy') || 'performanceScore';
  const sortOrder = url.searchParams.get('sortOrder') || 'desc';
  const search = url.searchParams.get('search') || '';
  const startDate = url.searchParams.get('startDate') || '';
  const endDate = url.searchParams.get('endDate') || '';

  // Build query object
  const query: any = {};
  if (search) query.search = search;
  if (startDate) query.startDate = startDate;
  if (endDate) query.endDate = endDate;

  const options = {
    page,
    limit,
    sortBy,
    sortOrder: sortOrder as 'asc' | 'desc',
  };

  return {
    performanceData: getEmployeesPerformance(query, options, user!).catch(
      (error) => {
        console.error('Error fetching performance data:', error);
        return {
          success: false,
          message: error.message || 'Có lỗi xảy ra khi lấy dữ liệu hiệu suất',
        };
      },
    ),
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
        <div className='font-bold text-lg'>
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
        <div className='flex items-center space-x-3'>
          <Avatar className='h-10 w-10'>
            <AvatarImage
              src={employee.employeeAvatar}
              alt={employee.employeeName}
            />
            <AvatarFallback className='bg-red-900/10 text-red-900 font-semibold text-xs'>
              {employee.employeeName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className='min-w-0 flex-1'>
            <Link
              to={`/erp/employees/${employee.employeeId}`}
              className='font-semibold text-gray-900 hover:text-red-900 transition-colors block truncate'
            >
              {employee.employeeName}
            </Link>
            <p className='text-sm text-gray-600 truncate'>
              {employee.employeeCode} • {employee.department}
            </p>
            <p className='text-xs text-gray-500 truncate'>
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
            )} font-bold text-sm px-3 py-1`}
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
        <div className='flex items-center'>
          <div>
            <p className='text-sm font-semibold mb-1'>
              {employee.completedTasks}/{employee.totalTasks}
            </p>
            <p className='text-xs text-gray-500 mt-1'>
              {Math.round(employee.completionRate)}%
            </p>
          </div>
          <div className='w-20 mx-auto'>
            <Progress value={employee.completionRate} className='h-2' />
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
        <div className='space-x-1'>
          <span className='text-sm font-semibold text-green-600'>
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
        <div className='space-x-1'>
          <span className='text-sm font-semibold text-red-600'>
            {employee.overdueTasks}
          </span>
          <span className='text-xs text-gray-500'>task</span>
        </div>
      ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      visible: true,
      render: (employee) => (
        <div className=''>
          <Button variant='outline' size='sm' asChild>
            <Link to={`/erp/employees/${employee.employeeId}`}>
              <User className='w-4 h-4 mr-1' />
              Chi tiết
            </Link>
          </Button>
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
    <div className='space-y-4 md:space-y-6 min-h-screen'>
      {/* Content Header */}
      <ContentHeader
        title='Hiệu suất nhân viên'
        backHandler={() => navigate('..')}
      />

      <Defer resolve={performanceData} fallback={<LoadingCard />}>
        {(data: PerformanceData | { success: false; message: string }) => {
          if (!data || 'success' in data) {
            return (
              <ErrorCard
                message={
                  data && 'message' in data && typeof data.message === 'string'
                    ? data.message
                    : 'Đã xảy ra lỗi khi tải dữ liệu hiệu suất'
                }
              />
            );
          }

          return (
            <>
              {/* Summary Statistics */}
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                <Card>
                  <CardContent className='p-6'>
                    <div className='flex items-center'>
                      <Users className='h-8 w-8 text-blue-600' />
                      <div className='ml-4'>
                        <p className='text-sm font-medium text-gray-600'>
                          Tổng nhân viên
                        </p>
                        <p className='text-2xl font-bold text-gray-900'>
                          {data.summary.totalEmployees}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className='p-6'>
                    <div className='flex items-center'>
                      <Target className='h-8 w-8 text-green-600' />
                      <div className='ml-4'>
                        <p className='text-sm font-medium text-gray-600'>
                          Tỷ lệ hoàn thành TB
                        </p>
                        <p className='text-2xl font-bold text-gray-900'>
                          {Math.round(data.summary.averageCompletionRate)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className='p-6'>
                    <div className='flex items-center'>
                      <Clock className='h-8 w-8 text-orange-600' />
                      <div className='ml-4'>
                        <p className='text-sm font-medium text-gray-600'>
                          Tỷ lệ đúng hạn TB
                        </p>
                        <p className='text-2xl font-bold text-gray-900'>
                          {Math.round(data.summary.averageOnTimeRate)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className='p-6'>
                    <div className='flex items-center'>
                      <TrendingUp className='h-8 w-8 text-purple-600' />
                      <div className='ml-4'>
                        <p className='text-sm font-medium text-gray-600'>
                          Điểm hiệu suất TB
                        </p>
                        <p className='text-2xl font-bold text-gray-900'>
                          {Math.round(data.summary.averagePerformanceScore)}/100
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Leaderboard */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center justify-between'>
                    <div className='flex items-center'>
                      <Trophy className='w-5 h-5 mr-2 text-yellow-600' />
                      Bảng xếp hạng hiệu suất
                    </div>
                    <Badge variant='outline'>
                      {data.pagination.total} nhân viên
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className='p-0'>
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

              {/* Performance Period Info */}
              {data.summary.periodStart && data.summary.periodEnd && (
                <Card>
                  <CardContent className='p-4'>
                    <div className='flex items-center justify-center text-sm text-gray-600'>
                      <Calendar className='w-4 h-4 mr-2' />
                      Dữ liệu từ{' '}
                      {new Date(data.summary.periodStart).toLocaleDateString(
                        'vi-VN',
                      )}{' '}
                      đến{' '}
                      {new Date(data.summary.periodEnd).toLocaleDateString(
                        'vi-VN',
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          );
        }}
      </Defer>
    </div>
  );
}
