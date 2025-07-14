import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  Clock,
  ArrowUpRight,
  AlertCircle,
  CheckCircle,
  Calendar,
  User,
} from 'lucide-react';
import { Link } from '@remix-run/react';
import { ITask } from '~/interfaces/task.interface';
import { formatDate } from '~/utils';
import {
  TASK,
  TASK_PRIORITY_BADGE_CLASSES,
  TASK_STATUS_BADGE_CLASSES,
} from '~/constants/task.constant';

interface RecentTasksProps {
  tasks: ITask[];
}

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'hoàn thành':
      return CheckCircle;
    case 'overdue':
    case 'quá hạn':
      return AlertCircle;
    default:
      return Clock;
  }
};

export default function RecentTasks({ tasks }: RecentTasksProps) {
  return (
    <Card className='h-full'>
      <CardHeader className='pb-4'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-xl font-bold flex items-center'>
            <Clock className='w-5 h-5 mr-2 text-red-900' />
            Công việc gần đây
          </CardTitle>
          <Button variant='ghost' size='sm' asChild>
            <Link
              to='/erp/tasks?sortBy=createdAt&sortOrder=desc'
              className='flex items-center'
            >
              Xem tất cả
              <ArrowUpRight className='w-4 h-4 ml-1' />
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {tasks.length === 0 ? (
          <div className='text-center py-8'>
            <Clock className='w-12 h-12 text-muted-foreground mx-auto mb-4' />
            <p className='text-muted-foreground'>Không có công việc gần đây</p>
          </div>
        ) : (
          tasks.map((task) => {
            const StatusIcon = getStatusIcon(task.tsk_status);

            return (
              <div
                key={task.id}
                className='border rounded-lg p-4 hover:bg-muted/50 transition-colors'
              >
                <div className='flex items-start justify-between mb-3'>
                  <div className='flex-1 min-w-0'>
                    <Link
                      to={`/erp/tasks/${task.id}`}
                      className='text-sm font-medium text-foreground hover:text-red-900 transition-colors line-clamp-2'
                    >
                      {task.tsk_name}
                    </Link>

                    <div className='flex items-center space-x-2 mt-2'>
                      <Badge
                        className={
                          TASK_PRIORITY_BADGE_CLASSES[task.tsk_priority]
                        }
                      >
                        {TASK.PRIORITY[task.tsk_priority]}
                      </Badge>

                      <div
                        className={`flex items-center gap-2 text-sm ${
                          TASK_STATUS_BADGE_CLASSES[task.tsk_status]
                        }`}
                      >
                        <StatusIcon className='w-3 h-3' />
                        {TASK.STATUS[task.tsk_status]}
                      </div>
                    </div>
                  </div>
                </div>

                <div className='flex items-center justify-between text-xs text-muted-foreground'>
                  <div className='flex items-center space-x-4'>
                    <div className='flex items-center space-x-1'>
                      <Calendar className='w-3 h-3' />
                      <span>Hạn: {formatDate(task.tsk_endDate)}</span>
                    </div>

                    {task.tsk_assignees && task.tsk_assignees.length > 0 && (
                      <div className='flex items-center space-x-1'>
                        <User className='w-3 h-3' />
                        <span>{task.tsk_assignees.length} người thực hiện</span>
                      </div>
                    )}
                  </div>

                  {task.tsk_caseService && (
                    <Link
                      to={`/erp/crm/cases/${task.tsk_caseService.id}`}
                      className='text-red-900 hover:text-red-800 transition-colors'
                    >
                      {task.tsk_caseService.case_code}
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
