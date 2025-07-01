import { Link } from '@remix-run/react';
import { useState } from 'react';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import List from '~/components/List';
import { IAttendance } from '~/interfaces/attendance.interface';
import { IListColumn } from '~/interfaces/app.interface';
import { calHourDiff } from '~/utils';
import { Clock, Calendar, User, CheckCircle, XCircle } from 'lucide-react';

export default function EmployeeAttendanceList({
  attendanceStats,
}: {
  attendanceStats: IAttendance[];
}) {
  const [visibleColumns, setVisibleColumns] = useState<
    IListColumn<IAttendance>[]
  >([
    {
      title: 'Nhân viên',
      key: 'employee',
      visible: true,
      sortField: 'employee.emp_user.usr_firstName',
      render: (item) => (
        <Link
          to={`/erp/employees/${item.employee.id}`}
          className='text-blue-600 hover:underline block w-full h-full'
        >
          <div className='flex items-center space-x-3'>
            <div className='flex-shrink-0 h-8 w-8'>
              {item.employee.emp_user.usr_avatar?.img_url ? (
                <img
                  className='h-8 w-8 rounded-full object-cover'
                  src={item.employee.emp_user.usr_avatar.img_url}
                  alt=''
                />
              ) : (
                <div className='h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center'>
                  <User className='h-4 w-4 text-gray-400' />
                </div>
              )}
            </div>
            <div>
              <div className='text-sm font-medium'>
                {item.employee.emp_user.usr_firstName}{' '}
                {item.employee.emp_user.usr_lastName}
              </div>
              <div className='text-xs text-gray-500'>
                {item.employee.emp_code || 'Chưa có mã'}
              </div>
            </div>
          </div>
        </Link>
      ),
    },
    {
      title: 'Ngày',
      key: 'date',
      visible: true,
      sortField: 'date',
      render: (item) => (
        <div className='flex items-center space-x-2'>
          <Calendar className='w-4 h-4 text-gray-400' />
          <span className='text-sm text-gray-600'>
            {new Date(item.date).toLocaleDateString('vi-VN')}
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
  ]);

  return (
    <Card className='col-span-2 rounded-xl overflow-hidden shadow-lg border border-gray-200'>
      <CardHeader className='bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-4'>
        <CardTitle className='text-white text-xl font-bold flex items-center'>
          <Clock className='w-5 h-5 mr-2' />
          Chấm công hôm nay
        </CardTitle>
      </CardHeader>
      <CardContent className='p-0'>
        <List<IAttendance>
          itemsPromise={{
            data: attendanceStats,
            pagination: {
              total: attendanceStats.length,
              limit: attendanceStats.length,
              page: 1,
              totalPages: 1,
            },
          }}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          name='Chấm công'
          showToolbar={false}
          showPagination={false}
        />
      </CardContent>
    </Card>
  );
}
