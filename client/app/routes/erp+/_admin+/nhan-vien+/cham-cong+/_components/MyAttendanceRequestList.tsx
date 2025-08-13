import { Link, useFetcher } from '@remix-run/react';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { IAttendanceRequestBrief } from '~/interfaces/attendanceRequest.interface';
import {
  Calendar,
  CheckCircle,
  Clock,
  MessageSquare,
  User,
  XCircle,
  FileText,
} from 'lucide-react';
import { IListResponse } from '~/interfaces/response.interface';
import List from '~/components/List';
import { IListColumn } from '~/interfaces/app.interface';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '~/components/ui/alert-dialog';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

export default function EmployeeAttendanceRequestList({
  attendanceRequests,
}: {
  attendanceRequests: IListResponse<IAttendanceRequestBrief>;
}) {
  const { data: requests } = attendanceRequests;

  const [visibleColumns, setVisibleColumns] = useState<
    IListColumn<IAttendanceRequestBrief>[]
  >([
    {
      title: 'Nhân viên',
      key: 'employee',
      visible: true,
      sortField: 'employee.emp_user.usr_firstName',
      render: (item) => (
        <Link
          to={`../attendance-requests/${item.id}`}
          className='text-blue-600 hover:underline block w-full h-full'
        >
          <div className='flex items-center space-x-2 sm:space-x-3'>
            <div className='flex-shrink-0 h-6 w-6 sm:h-8 sm:w-8'>
              <div className='h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-gray-200 flex items-center justify-center'>
                <User className='h-3 w-3 sm:h-4 sm:w-4 text-gray-400' />
              </div>
            </div>
            <div className='min-w-0 flex-1'>
              <div className='text-xs sm:text-sm font-medium truncate'>
                {item.employee.emp_user.usr_firstName}{' '}
                {item.employee.emp_user.usr_lastName}
              </div>
              <div className='text-xs text-gray-500 truncate'>
                <span className='hidden sm:inline'>
                  {item.employee.emp_code || 'Chưa có mã'}
                </span>
                <span className='sm:hidden'>
                  {item.employee.emp_code || 'N/A'}
                </span>
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
        <div className='flex items-center space-x-1 sm:space-x-2'>
          <Calendar className='w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0' />
          <span className='text-xs sm:text-sm text-gray-600 truncate'>
            {item.date
              ? new Date(item.date).toLocaleDateString('vi-VN')
              : 'N/A'}
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
        <div className='flex items-center space-x-1 sm:space-x-2'>
          <CheckCircle className='w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0' />
          <span className='text-xs sm:text-sm text-gray-900 truncate'>
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
        <div className='flex items-center space-x-1 sm:space-x-2'>
          <XCircle className='w-3 h-3 sm:w-4 sm:h-4 text-red-500 flex-shrink-0' />
          <span className='text-xs sm:text-sm text-gray-900 truncate'>
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
      title: 'Lý do',
      key: 'message',
      visible: true,
      sortField: 'message',
      render: (item) => (
        <AlertDialog>
          <AlertDialogTrigger className='text-left w-full truncate hover:underline text-xs sm:text-sm'>
            <span className='block truncate max-w-[120px] sm:max-w-none'>
              {item.message || 'Không có lý do'}
            </span>
          </AlertDialogTrigger>
          <AlertDialogContent className='max-w-[95vw] sm:max-w-md'>
            <AlertDialogHeader className='overflow-hidden'>
              <AlertDialogTitle className='text-sm sm:text-base'>
                Nhân viên:{' '}
                {`${item.employee?.emp_user?.usr_firstName} ${item.employee?.emp_user?.usr_lastName}`}
              </AlertDialogTitle>
              <AlertDialogDescription className='text-pretty break-words text-xs sm:text-sm'>
                {item.message || 'Không có lý do'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className='text-xs sm:text-sm'>
                Đóng
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      visible: true,
      render: () => (
        <Badge
          variant='outline'
          className='text-yellow-600 bg-yellow-50 text-xs'
        >
          <span className='hidden sm:inline'>Chờ duyệt</span>
          <span className='sm:hidden'>Chờ</span>
        </Badge>
      ),
    },
  ]);

  return (
    <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200'>
      <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white p-3 sm:p-4'>
        <CardTitle className='text-white text-lg sm:text-xl font-bold flex items-center'>
          <FileText className='w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0' />
          <span className='hidden sm:inline'>Yêu cầu chấm công</span>
          <span className='sm:hidden'>Yêu cầu</span>
        </CardTitle>
      </CardHeader>
      <CardContent className='p-0'>
        <List<IAttendanceRequestBrief>
          itemsPromise={{
            data: requests || [],
            pagination: {
              total: requests?.length || 0,
              limit: requests?.length || 0,
              page: 1,
              totalPages: 1,
            },
          }}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          name='Yêu cầu chấm công'
          showToolbar={false}
          showPagination={false}
        />
      </CardContent>
    </Card>
  );
}
