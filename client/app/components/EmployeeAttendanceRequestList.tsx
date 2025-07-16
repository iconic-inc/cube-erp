import { Link, useFetcher } from '@remix-run/react';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { IAttendanceRequestBrief } from '~/interfaces/attendanceRequest.interface';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import {
  Calendar,
  CheckCircle,
  Clock,
  MessageSquare,
  User,
  XCircle,
  FileText,
} from 'lucide-react';
import { formatDate } from '~/utils';
import { Button } from './ui/button';
import { IListResponse } from '~/interfaces/response.interface';
import List from '~/components/List';
import { IListColumn } from '~/interfaces/app.interface';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';

// Action buttons component for handling accept/reject
function AttendanceRequestActions({
  request,
}: {
  request: IAttendanceRequestBrief;
}) {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state === 'submitting';
  const toastIdRef = useRef<any>(null);

  // Handle response and show toast
  useEffect(() => {
    switch (fetcher.state) {
      case 'submitting':
        toastIdRef.current = toast.loading('Đang xử lý...', {
          autoClose: false,
        });
        break;

      case 'idle':
        if (
          fetcher.data &&
          typeof fetcher.data === 'object' &&
          'toast' in fetcher.data &&
          toastIdRef.current
        ) {
          const { toast: toastData } = fetcher.data as any;
          toast.update(toastIdRef.current, {
            render: toastData.message,
            type: toastData.type || 'success',
            autoClose: 3000,
            isLoading: false,
          });
          toastIdRef.current = null;
        } else if (toastIdRef.current) {
          toast.dismiss(toastIdRef.current);
          toastIdRef.current = null;
        }
        break;
    }
  }, [fetcher.state, fetcher.data]);

  return (
    <fetcher.Form method='post' className='flex flex-col sm:flex-row gap-2'>
      <input type='hidden' name='requestId' value={request.id} />

      <Button
        type='submit'
        name='action'
        value='accept'
        size='sm'
        className='bg-green-600 hover:bg-green-700 text-xs'
        disabled={isSubmitting}
      >
        <CheckCircle className='h-3 w-3 md:h-4 md:w-4 mr-1' />
        <span className='hidden sm:inline'>Chấp nhận</span>
        <span className='sm:hidden'>Chấp nhận</span>
      </Button>

      <Button
        type='submit'
        name='action'
        value='reject'
        size='sm'
        variant='destructive'
        className='text-xs'
        disabled={isSubmitting}
      >
        <XCircle className='h-3 w-3 md:h-4 md:w-4 mr-1' />
        <span className='hidden sm:inline'>Từ chối</span>
        <span className='sm:hidden'>Từ chối</span>
      </Button>
    </fetcher.Form>
  );
}

export default function EmployeeAttendanceRequestList({
  attendanceRequests,
}: {
  attendanceRequests: IListResponse<IAttendanceRequestBrief>;
}) {
  const { data: requests } = attendanceRequests;
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
          <div className='flex items-center space-x-2 md:space-x-3'>
            <div className='flex-shrink-0 h-6 w-6 md:h-8 md:w-8'>
              <div className='h-6 w-6 md:h-8 md:w-8 rounded-full bg-gray-200 flex items-center justify-center'>
                <User className='h-3 w-3 md:h-4 md:w-4 text-gray-400' />
              </div>
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
      visible: !isMobile, // Hide on mobile
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
      title: 'Lý do',
      key: 'message',
      visible: true,
      sortField: 'message',
      render: (item) => (
        <AlertDialog>
          <AlertDialogTrigger className='text-left w-full truncate hover:underline text-xs md:text-sm max-w-[100px] md:max-w-[200px]'>
            {item.message || 'Không có lý do'}
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader className='overflow-hidden'>
              <AlertDialogTitle>
                Nhân viên:{' '}
                {`${item.employee?.emp_user?.usr_firstName} ${item.employee?.emp_user?.usr_lastName}`}
              </AlertDialogTitle>
              <AlertDialogDescription className='text-pretty truncate'>
                {item.message || 'Không có lý do'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Đóng</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      visible: !isMobile, // Hide on mobile
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
    {
      title: 'Thao tác',
      key: 'actions',
      visible: true,
      render: (item) => <AttendanceRequestActions request={item} />,
    },
  ]);

  // Update column visibility when isMobile changes
  useEffect(() => {
    setVisibleColumns((prev) =>
      prev.map((col) => {
        if (
          col.key === 'date' ||
          col.key === 'checkIn' ||
          col.key === 'checkOut' ||
          col.key === 'status'
        ) {
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
          <FileText className='w-4 h-4 md:w-5 md:h-5 mr-2' />
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
