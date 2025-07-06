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
    <fetcher.Form method='post' className='flex gap-2'>
      <input type='hidden' name='requestId' value={request.id} />

      <Button
        type='submit'
        name='action'
        value='accept'
        size='sm'
        className='bg-green-600 hover:bg-green-700'
        disabled={isSubmitting}
      >
        <CheckCircle className='h-4 w-4 mr-1' />
        Chấp nhận
      </Button>

      <Button
        type='submit'
        name='action'
        value='reject'
        size='sm'
        variant='destructive'
        disabled={isSubmitting}
      >
        <XCircle className='h-4 w-4 mr-1' />
        Từ chối
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
          <div className='flex items-center space-x-3'>
            <div className='flex-shrink-0 h-8 w-8'>
              <div className='h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center'>
                <User className='h-4 w-4 text-gray-400' />
              </div>
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
      title: 'Lý do',
      key: 'message',
      visible: true,
      sortField: 'message',
      render: (item) => (
        <AlertDialog>
          <AlertDialogTrigger className='text-left w-full truncate hover:underline'>
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
      visible: true,
      render: () => (
        <Badge variant='outline' className='text-yellow-600 bg-yellow-50'>
          Chờ duyệt
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

  return (
    <Card className='col-span-2 rounded-xl overflow-hidden shadow-lg border border-gray-200'>
      <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white py-4'>
        <CardTitle className='text-white text-xl font-bold flex items-center'>
          <FileText className='w-5 h-5 mr-2' />
          Yêu cầu chấm công
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
