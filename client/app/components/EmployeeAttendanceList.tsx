import { Link } from '@remix-run/react';
import { useState, useEffect } from 'react';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import List from '~/components/List';
import { IAttendance } from '~/interfaces/attendance.interface';
import { IListColumn } from '~/interfaces/app.interface';
import { calHourDiff } from '~/utils';
import { Clock, Calendar, User, CheckCircle, XCircle } from 'lucide-react';
import { Button } from './ui/button';

export default function EmployeeAttendanceList({
  attendanceStats,
}: {
  attendanceStats: IAttendance[];
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

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
          prefetch='intent'
          className='text-blue-600 hover:underline block w-full h-full'
        >
          <div className='flex items-center space-x-2 md:space-x-3'>
            <div className='flex-shrink-0 h-6 w-6 md:h-8 md:w-8'>
              {item.employee.emp_user.usr_avatar?.img_url ? (
                <img
                  className='h-6 w-6 md:h-8 md:w-8 rounded-full object-cover'
                  src={item.employee.emp_user.usr_avatar.img_url}
                  alt=''
                />
              ) : (
                <div className='h-6 w-6 md:h-8 md:w-8 rounded-full bg-gray-200 flex items-center justify-center'>
                  <User className='h-3 w-3 md:h-4 md:w-4 text-gray-400' />
                </div>
              )}
            </div>
            <div className='min-w-0 flex-1'>
              <div className='text-xs md:text-sm font-medium truncate'>
                {item.employee.emp_user.usr_firstName}{' '}
                {item.employee.emp_user.usr_lastName}
              </div>
              <div className='text-xs text-gray-500 truncate'>
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
      visible: !isMobile, // Hide on mobile
      sortField: 'date',
      render: (item) => (
        <div className='flex items-center space-x-1 md:space-x-2'>
          <Calendar className='w-3 h-3 md:w-4 md:h-4 text-gray-400 flex-shrink-0' />
          <span className='text-xs md:text-sm text-gray-600 truncate'>
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
        <div className='flex items-center space-x-1 md:space-x-2'>
          <CheckCircle className='w-3 h-3 md:w-4 md:h-4 text-green-500 flex-shrink-0' />
          <span className='text-xs md:text-sm text-gray-900 truncate'>
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
      visible: !isMobile, // Hide on mobile
      sortField: 'checkOutTime',
      render: (item) => (
        <div className='flex items-center space-x-1 md:space-x-2'>
          <XCircle className='w-3 h-3 md:w-4 md:h-4 text-red-500 flex-shrink-0' />
          <span className='text-xs md:text-sm text-gray-900 truncate'>
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
        <div className='flex items-center space-x-1 md:space-x-2'>
          <Clock className='w-3 h-3 md:w-4 md:h-4 text-blue-500 flex-shrink-0' />
          <Badge
            variant={
              item.checkInTime && item.checkOutTime ? 'default' : 'secondary'
            }
            className='text-xs truncate max-w-full'
          >
            {item.checkInTime && item.checkOutTime
              ? `${calHourDiff(item.checkInTime, item.checkOutTime)} giờ`
              : 'Chưa ra'}
          </Badge>
        </div>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      visible: true,
      render: (item) => (
        <Button variant={'primary'} asChild size='sm' className='text-xs'>
          <Link
            to={`/erp/attendance/detail?employeeId=${item.employee.id}`}
            prefetch='intent'
          >
            <span className='hidden sm:inline'>Xem chi tiết</span>
            <span className='sm:hidden'>Chi tiết</span>
          </Link>
        </Button>
      ),
    },
  ]);

  // Update column visibility when isMobile changes
  useEffect(() => {
    setVisibleColumns((prev) =>
      prev.map((col) => {
        if (col.key === 'date' || col.key === 'checkOut') {
          return { ...col, visible: !isMobile };
        }
        return col;
      }),
    );
  }, [isMobile]);

  return (
    <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200'>
      <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white py-3 md:py-4'>
        <CardTitle className='text-white text-lg md:text-xl font-bold flex items-center'>
          <Clock className='w-4 h-4 md:w-5 md:h-5 mr-2' />
          <span className='hidden sm:inline'>Chấm công hôm nay</span>
          <span className='sm:hidden'>Chấm công</span>
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
