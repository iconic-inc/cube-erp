import { Link, useNavigate } from '@remix-run/react';
import { ITask } from '~/interfaces/task.interface';
import { IListColumn, ILoaderDataPromise } from '~/interfaces/app.interface';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Clock } from 'lucide-react';
import { IListResponse } from '~/interfaces/response.interface';
import List from '~/components/List';
import { useState } from 'react';
import {
  TASK,
  TASK_PRIORITY_BADGE_CLASSES,
  TASK_STATUS_BADGE_CLASSES,
} from '~/constants/task.constant';
import { formatDate } from '~/utils';

export default function EmployeeTaskList({
  employeeId,
  taskPromise,
}: {
  employeeId: string;
  taskPromise: ILoaderDataPromise<IListResponse<ITask>>;
}) {
  const navigate = useNavigate();
  const [visibleColumns, setVisibleColumns] = useState<IListColumn<ITask>[]>([
    {
      key: 'tsk_name',
      title: 'Tên Task',
      visible: true,
      sortField: 'tsk_name',
      render: (task) => (
        <Link
          prefetch='intent'
          to={`/erp/tasks/${task.id}`}
          className='text-blue-600 hover:underline py-2'
        >
          {task.tsk_name}
        </Link>
      ),
    },
    {
      key: 'tsk_assignees',
      title: 'Người thực hiện',
      visible: true,
      sortField: 'tsk_assignees',
      render: (task) => (
        <span>
          {task.tsk_assignees
            .map(({ emp_user: user }) => `${user?.usr_firstName}`)
            .join(', ')}
        </span>
      ),
    },
    {
      key: 'tsk_caseService',
      title: 'Mã Hồ sơ',
      visible: true,
      sortField: 'tsk_caseService.case_code',
      render: (task) =>
        task.tsk_caseService ? (
          <Link
            prefetch='intent'
            to={`/erp/cases/${task.tsk_caseService?.id}`}
            className='text-blue-600 hover:underline'
          >
            {task.tsk_caseService?.case_code}
          </Link>
        ) : (
          '-'
        ),
    },
    {
      key: 'tsk_startDate',
      title: 'Ngày bắt đầu',
      visible: true,
      sortField: 'tsk_startDate',
      render: (task) => formatDate(task.tsk_startDate, 'HH:mm - DD/MM/YYYY'),
    },
    {
      key: 'tsk_endDate',
      title: 'Ngày kết thúc',
      visible: true,
      sortField: 'tsk_endDate',
      render: (task) => formatDate(task.tsk_endDate, 'HH:mm - DD/MM/YYYY'),
    },
    {
      key: 'tsk_priority',
      title: 'Ưu tiên',
      visible: true,
      sortField: 'tsk_priority',
      render: (task) => (
        <span className={`${TASK_PRIORITY_BADGE_CLASSES[task.tsk_priority]}`}>
          {TASK.PRIORITY[task.tsk_priority]}
        </span>
      ),
    },
    {
      key: 'tsk_status',
      title: 'Trạng thái',
      visible: true,
      sortField: 'tsk_status',
      render: (task) => (
        <span className={`${TASK_STATUS_BADGE_CLASSES[task.tsk_status]}`}>
          {TASK.STATUS[task.tsk_status]}
        </span>
      ),
    },
  ]);

  return (
    <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200'>
      <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white py-3 sm:py-4'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-white text-lg sm:text-xl font-bold flex items-center'>
            <Clock className='w-5 h-5 sm:w-6 sm:h-6 mr-2' />
            <span className='hidden sm:inline'> Task 7 ngày gần nhất</span>
            <span className='sm:hidden'>Task (7 ngày)</span>
          </CardTitle>
          <Button
            size='sm'
            variant='secondary'
            className='bg-white/20 hover:bg-white/30 text-white border-white/30 text-sm sm:text-base'
            asChild
          >
            <Link
              to={`/erp/task/detail?employeeId=${employeeId}`}
              prefetch='intent'
            >
              <span className='hidden sm:inline'>Xem tất cả</span>
              <span className='sm:hidden'>Xem tất cả</span>
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className='p-0'>
        <List<ITask>
          showToolbar={false}
          showPagination={false}
          itemsPromise={taskPromise}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          addNewHandler={() => navigate('/erp/tasks/new')}
          name='Task'
          deleteHandleRoute='/erp/tasks?index'
        />
      </CardContent>
    </Card>
  );
}

// Helper function to calculate work hours
function calculateWorkHours(checkIn: string, checkOut: string): string {
  const checkInTime = new Date(checkIn);
  const checkOutTime = new Date(checkOut);
  const diffInMs = checkOutTime.getTime() - checkInTime.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);

  const hours = Math.floor(diffInHours);
  const minutes = Math.floor((diffInHours - hours) * 60);

  return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
}
