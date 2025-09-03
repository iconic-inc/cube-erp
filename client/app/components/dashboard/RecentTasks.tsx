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
      <CardHeader className='pb-3 sm:pb-4'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-lg sm:text-xl font-bold flex items-center'>
            <Clock className='w-4 h-4 sm:w-5 sm:h-5 mr-2 text-red-900' />
            <span className='sm:inline'>Công việc gần đây</span>
          </CardTitle>
          <Button variant='ghost' size='sm' asChild>
            <Link
              to='/erp/tasks?sortBy=createdAt&sortOrder=desc'
              prefetch='intent'
              className='flex items-center'
            >
              <span className='hidden sm:inline'>Xem tất cả</span>
              <span className='sm:hidden'>Xem</span>
              <ArrowUpRight className='w-4 h-4' />
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className='space-y-3 sm:space-y-4 p-3 sm:p-6'>
        {tasks.length === 0 ? (
          <div className='text-center py-6 sm:py-8'>
            <Clock className='w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4' />
            <p className='text-sm sm:text-base text-muted-foreground'>
              Không có công việc gần đây
            </p>
          </div>
        ) : (
          tasks.map((task) => {
            const StatusIcon = getStatusIcon(task.tsk_status);

            return (
              <div
                key={task.id}
                className='border rounded-lg p-2 sm:p-4 hover:bg-muted/50 transition-colors'
              >
                <div className='flex items-start justify-between mb-2 sm:mb-3'>
                  <div className='flex-1 min-w-0 pr-2'>
                    <Link
                      to={`/erp/tasks/${task.id}`}
                      prefetch='intent'
                      className='text-sm sm:text-base font-medium text-foreground hover:text-red-900 transition-colors line-clamp-2'
                    >
                      {task.tsk_name}
                    </Link>

                    <div className='flex items-center space-x-1 sm:space-x-2 mt-1 sm:mt-2 flex-wrap gap-1'>
                      <Badge
                        className={`text-xs ${
                          TASK_PRIORITY_BADGE_CLASSES[task.tsk_priority]
                        }`}
                      >
                        {TASK.PRIORITY[task.tsk_priority]}
                      </Badge>

                      <div
                        className={`flex items-center gap-1 text-xs ${
                          TASK_STATUS_BADGE_CLASSES[task.tsk_status]
                        }`}
                      >
                        <StatusIcon className='w-3 h-3' />
                        <span className='sm:inline'>
                          {TASK.STATUS[task.tsk_status]}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className='flex items-center justify-between text-xs text-muted-foreground mt-2 gap-2'>
                  <div className='flex items-center space-x-1 sm:space-x-4 flex-wrap gap-1'>
                    <div className='flex items-center space-x-1'>
                      <Calendar className='w-3 h-3' />
                      <span className='hidden sm:inline'>
                        Hạn: {formatDate(task.tsk_endDate)}
                      </span>
                      <span className='sm:hidden'>
                        {formatDate(task.tsk_endDate)}
                      </span>
                    </div>

                    {/* {task.tsk_assignees && task.tsk_assignees.length > 0 && (
                      <div className='flex items-center space-x-1'>
                        <User className='w-3 h-3' />
                        <span className='hidden sm:inline'>
                          {task.tsk_assignees.length} người thực hiện
                        </span>
                        <span className='sm:hidden'>
                          {task.tsk_assignees.length}
                        </span>
                      </div>
                    )} */}
                  </div>

                  {task.tsk_caseService && (
                    <Link
                      to={`/erp/cases/${task.tsk_caseService.id}`}
                      prefetch='intent'
                      className='text-red-900 hover:text-red-800 transition-colors text-xs shrink-0'
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
