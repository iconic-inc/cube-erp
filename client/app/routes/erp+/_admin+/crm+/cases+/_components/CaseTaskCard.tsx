import { Link } from '@remix-run/react';
import TextRenderer from '~/components/TextRenderer';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import {
  TASK,
  TASK_PRIORITY_BADGE_CLASSES,
  TASK_STATUS_BADGE_CLASSES,
} from '~/constants/task.constant';
import { ITaskBrief, ITask } from '~/interfaces/task.interface';
import { formatDate } from '~/utils';

export default function CaseTaskCard({
  task,
  onDelete,
}: {
  task: ITask;
  onDelete: (taskId: string) => void;
}) {
  return (
    <Card className='rounded-lg border border-blue-200 bg-blue-50 shadow-sm p-3'>
      <CardHeader className='p-0 pb-1 flex-row items-start justify-between'>
        <div className='flex flex-col'>
          <CardTitle className='text-lg text-blue-800 leading-tight'>
            {task.tsk_name}
          </CardTitle>{' '}
          <div className='flex items-center space-x-1 mt-1'>
            <Badge
              className={`px-1.5 py-0.5 text-xs rounded-full ${TASK_PRIORITY_BADGE_CLASSES[task.tsk_priority]}`}
            >
              {TASK.PRIORITY[task.tsk_priority] || '-'}
            </Badge>
            <Badge
              className={`px-1.5 py-0.5 text-xs rounded-full ${TASK_STATUS_BADGE_CLASSES[task.tsk_status]}`}
            >
              {TASK.STATUS[task.tsk_status] || '-'}
            </Badge>
          </div>
        </div>

        <div className='flex flex-wrap gap-4 justify-center items-center px-2 h-full'>
          <Button
            variant='primary'
            className='p-2'
            title='View Task Details'
            asChild
          >
            <Link to={`/erp/tasks/${task.id}`}>Xem chi tiết</Link>
          </Button>

          <Button
            variant='destructive'
            onClick={() => onDelete(task.id)}
            className='p-2 h-auto'
            title='Delete Task'
          >
            Xóa
          </Button>
        </div>
      </CardHeader>
      <CardContent className='p-0 mt-1 flex'>
        <div className='space-y-1 flex-1'>
          {/* Re-added description as it makes sense for brevity */}
          <div className='text-sm text-gray-600 flex flex-wrap gap-x-3 gap-y-1'>
            <p>
              <span className='font-bold'>Bắt đầu:</span>{' '}
              {formatDate(task.tsk_startDate, 'HH:mm - DD/MM/YYYY')}
            </p>{' '}
            {/* Show only date part */}
            <p>
              <span className='font-bold'>Kết thúc:</span>{' '}
              {formatDate(task.tsk_endDate, 'HH:mm - DD/MM/YYYY')}
            </p>{' '}
            {/* Show only date part */}
            <p>
              <span className='font-bold'>Thứ tự:</span> {task.tsk_caseOrder}
            </p>
          </div>
          {task.tsk_assignees && task.tsk_assignees.length > 0 && (
            <div className='mt-2'>
              <p className='text-xs font-semibold text-blue-700 mb-0.5'>
                Người thực hiện:
              </p>
              <div className='text-xs text-gray-700'>
                {task.tsk_assignees.map((assignee) => (
                  <Link
                    key={assignee.id}
                    to={`/erp/employees/${assignee.id}`}
                    className='mr-1 text-blue-600'
                  >
                    <Badge
                      className='border-black hover:underline'
                      variant='outline'
                    >
                      {`${assignee.emp_user.usr_firstName} ${assignee.emp_user.usr_lastName}`}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
