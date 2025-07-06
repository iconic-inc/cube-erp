import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Progress } from '~/components/ui/progress';
import {
  CheckSquare,
  ArrowUpRight,
  AlertTriangle,
  Calendar,
  Target,
} from 'lucide-react';
import { Link } from '@remix-run/react';
import { ITask } from '~/interfaces/task.interface';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  TASK,
  TASK_PRIORITY_BADGE_CLASSES,
  TASK_STATUS_BADGE_CLASSES,
} from '~/constants/task.constant';

interface MyTasksOverviewProps {
  tasks: ITask[];
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  performanceScore: number;
}

export default function MyTasksOverview({
  tasks,
  totalTasks,
  completedTasks,
  pendingTasks,
  overdueTasks,
  performanceScore,
}: MyTasksOverviewProps) {
  const completionRate =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <Card className='h-full'>
      <CardHeader className='pb-4'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-xl font-bold flex items-center'>
            <CheckSquare className='w-5 h-5 mr-2 text-red-900' />
            Công việc của tôi
          </CardTitle>
          <Button variant='ghost' size='sm' asChild>
            <Link to='/erp/nhan-vien/tasks' className='flex items-center'>
              Xem tất cả
              <ArrowUpRight className='w-4 h-4 ml-1' />
            </Link>
          </Button>
        </div>

        {/* Performance Summary */}
        <div className='space-y-2'>
          <div className='flex items-center justify-between text-sm'>
            <span>Tỷ lệ hoàn thành</span>
            <span className='font-medium'>{completionRate.toFixed(1)}%</span>
          </div>
          <Progress value={completionRate} className='h-2' />

          <div className='grid grid-cols-3 gap-2 mt-2 text-xs'>
            <div className='text-center p-2 bg-green-50 rounded'>
              <div className='font-medium text-green-700'>{completedTasks}</div>
              <div className='text-green-600'>Hoàn thành</div>
            </div>
            <div className='text-center p-2 bg-blue-50 rounded'>
              <div className='font-medium text-blue-700'>{pendingTasks}</div>
              <div className='text-blue-600'>Đang làm</div>
            </div>
            <div className='text-center p-2 bg-red-50 rounded'>
              <div className='font-medium text-red-700'>{overdueTasks}</div>
              <div className='text-red-600'>Quá hạn</div>
            </div>
          </div>

          {performanceScore > 0 && (
            <div className='flex items-center justify-between text-sm pt-2 border-t'>
              <span className='flex items-center'>
                <Target className='w-4 h-4 mr-1 text-red-900' />
                Điểm hiệu suất
              </span>
              <Badge variant='outline' className='font-medium'>
                {performanceScore}/100
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className='space-y-3 overflow-y-auto'>
        {tasks.length === 0 ? (
          <div className='text-center py-8'>
            <CheckSquare className='w-12 h-12 text-muted-foreground mx-auto mb-4' />
            <p className='text-muted-foreground'>
              Không có công việc nào gần đây
            </p>
          </div>
        ) : (
          tasks.slice(0, 5).map((task) => (
            <div
              key={task.id}
              className='p-3 border rounded-lg hover:bg-muted/50 transition-colors'
            >
              <div className='flex items-start justify-between mb-2'>
                <Link
                  to={`/erp/tasks/${task.id}`}
                  className='font-medium text-sm hover:text-red-900 transition-colors flex-1 mr-2'
                >
                  {task.tsk_name}
                </Link>
                <Badge
                  variant='outline'
                  className={`text-xs ${TASK_STATUS_BADGE_CLASSES[task.tsk_status]}`}
                >
                  {TASK.STATUS[task.tsk_status]}
                </Badge>
              </div>

              <div className='flex items-center justify-between text-xs text-muted-foreground'>
                <div className='flex items-center space-x-3'>
                  <span
                    className={`flex items-center ${TASK_PRIORITY_BADGE_CLASSES[task.tsk_priority]}`}
                  >
                    <AlertTriangle className='w-3 h-3 mr-1' />
                    {TASK.PRIORITY[task.tsk_priority]}
                  </span>

                  {task.tsk_endDate && (
                    <span className='flex items-center'>
                      <Calendar className='w-3 h-3 mr-1' />
                      {format(new Date(task.tsk_endDate), 'dd/MM/yyyy', {
                        locale: vi,
                      })}
                    </span>
                  )}
                </div>

                {task.tsk_endDate &&
                  new Date(task.tsk_endDate) < new Date() &&
                  task.tsk_status !== 'completed' && (
                    <Badge variant='destructive' className='text-xs'>
                      Quá hạn
                    </Badge>
                  )}
              </div>

              {task.tsk_description && (
                <p className='text-xs text-muted-foreground mt-2 line-clamp-2'>
                  {task.tsk_description}
                </p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
