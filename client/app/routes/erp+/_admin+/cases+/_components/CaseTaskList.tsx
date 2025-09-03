import { Link, useFetcher, useNavigate } from '@remix-run/react';
import { toast } from 'react-toastify';
import { useEffect, useRef, useState } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '~/components/ui/card';
import { Progress } from '~/components/ui/progress';
import { Button } from '~/components/ui/button';
import { IListResponse } from '~/interfaces/response.interface';
import { ITask } from '~/interfaces/task.interface';
import { IListColumn, ILoaderDataPromise } from '~/interfaces/app.interface';
import Defer from '~/components/Defer';
import List from '~/components/List';
import {
  TASK,
  TASK_PRIORITY_BADGE_CLASSES,
  TASK_STATUS_BADGE_CLASSES,
} from '~/constants/task.constant';
import { formatDate } from '~/utils';
import { useFetcherResponseHandler } from '~/hooks/useFetcherResponseHandler';
import { action } from '..';

export default function CaseTaskList({
  caseId,
  caseTasksPromise,
}: {
  caseId: string;
  caseTasksPromise: ILoaderDataPromise<IListResponse<ITask>>;
}) {
  const fetcher = useFetcher<typeof action>();
  const navigate = useNavigate();

  const [visibleColumns, setVisibleColumns] = useState<IListColumn<ITask>[]>([
    {
      key: 'caseOrder',
      title: 'Thứ tự',
      visible: true,
      render: (task) => (
        <span className='text-center'>{task.tsk_caseOrder}</span>
      ),
    },
    {
      key: 'tsk_name',
      title: 'Tên Task',
      visible: true,
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
      key: 'tsk_startDate',
      title: 'Ngày bắt đầu',
      visible: true,
      sortField: 'tsk_startDate',
      render: (task) => formatDate(task.tsk_startDate),
    },
    {
      key: 'tsk_endDate',
      title: 'Ngày kết thúc',
      visible: true,
      sortField: 'tsk_endDate',
      render: (task) => formatDate(task.tsk_endDate),
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

  useFetcherResponseHandler(fetcher);

  return (
    <Defer resolve={caseTasksPromise}>
      {(caseTasks) => {
        const tasks = caseTasks.data || [];
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(
          (task) =>
            task.tsk_status === 'completed' || task.tsk_status === 'cancelled',
        ).length;
        const progressPercentage =
          totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        return (
          <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200 mt-8'>
            <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white py-6 rounded-t-xl'>
              <CardTitle className='text-white text-3xl font-bold'>
                Task được gán ({totalTasks})
              </CardTitle>
              <CardDescription className='text-blue-100 mt-2'>
                Tiến độ: {completedTasks} / {totalTasks} hoàn thành (
                {progressPercentage.toFixed(0)}%)
              </CardDescription>
              <div className='mt-4'>
                <Progress value={progressPercentage} className='h-3' />
              </div>
            </CardHeader>
            <CardContent className='p-2 md:p-6 space-y-4'>
              <div className='flex justify-end'>
                <Button variant='primary' className='px-4 py-2'>
                  <Link
                    prefetch='intent'
                    to={`/erp/tasks/new?caseId=${caseId}`}
                  >
                    Thêm Task
                  </Link>
                </Button>
              </div>

              <List<ITask>
                name='Task'
                itemsPromise={caseTasks}
                visibleColumns={visibleColumns}
                setVisibleColumns={setVisibleColumns}
                addNewHandler={() => navigate('/erp/tasks/new')}
                showPagination={false}
                showToolbar={false}
                deleteHandleRoute='/erp/tasks?index'
              />
            </CardContent>
          </Card>
        );
      }}
    </Defer>
  );
}
