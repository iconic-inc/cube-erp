import { LoaderFunctionArgs } from '@remix-run/node';
import {
  useLoaderData,
  useSearchParams,
  Link,
  useNavigate,
} from '@remix-run/react';
import {
  ArrowLeft,
  Clock,
  Calendar,
  User,
  CheckCircle,
  XCircle,
} from 'lucide-react';

import ContentHeader from '~/components/ContentHeader';
import { parseAuthCookie } from '~/services/cookie.server';
import { getAttendancesByEmployeeId } from '~/services/attendance.server';
import { getEmployeeById } from '~/services/employee.server';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import List from '~/components/List';
import { IAttendance } from '~/interfaces/attendance.interface';
import { IListColumn } from '~/interfaces/app.interface';
import { calHourDiff } from '~/utils';
import { Badge } from '~/components/ui/badge';
import { useState } from 'react';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await parseAuthCookie(request);
  const url = new URL(request.url);
  const employeeId = url.searchParams.get('employeeId');

  if (!employeeId) {
    throw new Response('Employee ID is required', { status: 400 });
  }

  try {
    const [attendanceRecords, employee] = await Promise.all([
      getAttendancesByEmployeeId(employeeId, user!),
      getEmployeeById(employeeId, user!),
    ]);

    return { attendanceRecords, employee, employeeId };
  } catch (error) {
    console.error('Error loading attendance details:', error);
    throw new Response('Failed to load attendance data', { status: 500 });
  }
};

export default function AttendanceDetail() {
  const { attendanceRecords, employee } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const employeeId = searchParams.get('employeeId');

  const [visibleColumns] = useState<IListColumn<IAttendance>[]>([
    {
      title: 'Ngày',
      key: 'date',
      visible: true,
      sortField: 'date',
      render: (item) => (
        <div className='flex items-center space-x-2'>
          <Calendar className='w-4 h-4 text-gray-400' />
          <span className='text-sm text-gray-600'>
            {new Date(item.date).toLocaleDateString('vi-VN', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      ),
    },
    {
      title: 'Giờ vào',
      key: 'checkIn',
      visible: true,
      sortField: 'checkInTime',
      render: (item) => (
        <div className='flex items-center space-x-2'>
          <CheckCircle className='w-4 h-4 text-green-500' />
          <span className='text-sm text-gray-900'>
            {item.checkInTime
              ? new Date(item.checkInTime).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '-'}
          </span>
        </div>
      ),
    },
    {
      title: 'Giờ ra',
      key: 'checkOut',
      visible: true,
      sortField: 'checkOutTime',
      render: (item) => (
        <div className='flex items-center space-x-2'>
          <XCircle className='w-4 h-4 text-red-500' />
          <span className='text-sm text-gray-900'>
            {item.checkOutTime
              ? new Date(item.checkOutTime).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '-'}
          </span>
        </div>
      ),
    },
    {
      title: 'Tổng giờ làm',
      key: 'totalHours',
      visible: true,
      sortField: 'totalHours',
      render: (item) => (
        <div className='flex items-center space-x-2'>
          <Clock className='w-4 h-4 text-blue-500' />
          <Badge
            variant={
              item.checkInTime && item.checkOutTime ? 'default' : 'secondary'
            }
            className='text-sm'
          >
            {item.checkInTime && item.checkOutTime
              ? `${calHourDiff(item.checkInTime, item.checkOutTime)} giờ`
              : 'Chưa ra'}
          </Badge>
        </div>
      ),
    },
    {
      title: 'IP Address',
      key: 'ip',
      visible: true,
      sortField: 'ip',
      render: (item) => (
        <span className='text-sm text-gray-600 font-mono'>
          {item.ip || '-'}
        </span>
      ),
    },
  ]);

  const navigate = useNavigate();
  return (
    <div className='space-y-4 md:space-y-6 min-h-screen'>
      {/* Content Header with Back Button */}
      <ContentHeader
        title='Chi tiết chấm công'
        backHandler={() => navigate('/erp/attendance')}
      />

      {/* Employee Info Card */}
      <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200'>
        <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white py-4'>
          <CardTitle className='text-white text-xl font-bold flex items-center'>
            <User className='w-5 h-5 mr-2' />
            Thông tin nhân viên
          </CardTitle>
        </CardHeader>
        <CardContent className='p-6'>
          <div className='flex items-center space-x-4'>
            <div className='flex-shrink-0 h-16 w-16'>
              {employee.emp_user.usr_avatar?.img_url ? (
                <img
                  className='h-16 w-16 rounded-full object-cover'
                  src={employee.emp_user.usr_avatar.img_url}
                  alt=''
                />
              ) : (
                <div className='h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center'>
                  <User className='h-8 w-8 text-gray-400' />
                </div>
              )}
            </div>
            <div className='flex-1'>
              <h3 className='text-lg font-semibold text-gray-900'>
                {employee.emp_user.usr_firstName}{' '}
                {employee.emp_user.usr_lastName}
              </h3>
              <p className='text-sm text-gray-600'>
                Mã nhân viên: {employee.emp_code || 'Chưa có mã'}
              </p>
              <p className='text-sm text-gray-600'>
                Chức vụ: {employee.emp_position || 'Chưa có chức vụ'}
              </p>
              <p className='text-sm text-gray-600'>
                Phòng ban: {employee.emp_department || 'Chưa có phòng ban'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Records */}
      <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200'>
        <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white py-4'>
          <CardTitle className='text-white text-xl font-bold flex items-center'>
            <Clock className='w-5 h-5 mr-2' />
            Lịch sử chấm công ({attendanceRecords.length} bản ghi)
          </CardTitle>
        </CardHeader>
        <CardContent className='p-0'>
          <List<IAttendance>
            itemsPromise={{
              data: attendanceRecords,
              pagination: {
                total: attendanceRecords.length,
                limit: attendanceRecords.length,
                page: 1,
                totalPages: 1,
              },
            }}
            visibleColumns={visibleColumns}
            setVisibleColumns={() => {}} // Read-only columns
            name='Chấm công'
            showToolbar={false}
            showPagination={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}
