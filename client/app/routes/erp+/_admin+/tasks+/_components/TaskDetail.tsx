import BriefEmployeeCard from '~/components/BriefEmployeeCard';
import Defer from '~/components/Defer';
import TextRenderer from '~/components/TextRenderer';
import { Badge } from '~/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  TASK,
  TASK_PRIORITY_BADGE_CLASSES,
  TASK_STATUS_BADGE_CLASSES,
} from '~/constants/task.constant';
import { ILoaderDataPromise } from '~/interfaces/app.interface';
import { ITask } from '~/interfaces/task.interface';
import { formatDate } from '~/utils';

export default function TaskDetail({
  taskPromise,
}: {
  taskPromise: ILoaderDataPromise<ITask>;
}) {
  return (
    <Defer resolve={taskPromise}>
      {(task) => (
        <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200'>
          <CardHeader className='bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-6 rounded-t-xl'>
            <CardTitle className='text-white text-3xl font-bold'>
              {task.tsk_name}
            </CardTitle>
            <CardDescription className='text-blue-100 mt-2 flex items-center gap-4'>
              <span>Task ID: {task.id}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className='p-6 space-y-6'>
            {/* Task Description */}
            <div>
              <Label
                htmlFor='tsk_description'
                className='text-gray-700 font-semibold mb-2 block'
              >
                Mô tả
              </Label>
              <div
                id='tsk_description'
                className='rounded-lg border border-gray-300 px-3 bg-gray-50 text-gray-800 break-words min-h-[80px]'
              >
                <TextRenderer
                  content={task.tsk_description || 'Không có mô tả'}
                />
              </div>
            </div>

            {/* Priority, Status, Case Order */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-gray-200 pt-6'>
              <div>
                <Label className='text-gray-700 font-semibold mb-2 block'>
                  Ưu tiên
                </Label>
                <Badge
                  className={`${TASK_PRIORITY_BADGE_CLASSES[task.tsk_priority]}`}
                >
                  {TASK.PRIORITY[task.tsk_priority]}
                </Badge>
              </div>
              <div>
                <Label className='text-gray-700 font-semibold mb-2 block'>
                  Trạng thái
                </Label>
                <Badge
                  className={`${TASK_STATUS_BADGE_CLASSES[task.tsk_status]}`}
                >
                  {TASK.STATUS[task.tsk_status]}
                </Badge>
              </div>

              <div>
                <Label className='text-gray-700 font-semibold mb-2 block'>
                  Ngày bắt đầu
                </Label>
                <Input
                  value={formatDate(task.tsk_startDate)}
                  readOnly
                  className='bg-white border-gray-300'
                />
              </div>
              <div>
                <Label className='text-gray-700 font-semibold mb-2 block'>
                  Ngày kết thúc
                </Label>
                <Input
                  value={formatDate(task.tsk_endDate)}
                  readOnly
                  className='bg-white border-gray-300'
                />
              </div>
            </div>

            {/* Assignees */}
            {task.tsk_assignees && task.tsk_assignees.length > 0 && (
              <div className='border-t border-gray-200 pt-6'>
                <h4 className='text-xl font-bold text-gray-800 mb-4 flex items-center'>
                  <span className='text-teal-600 mr-2'>&#128100;</span> Nhân
                  viên phụ trách
                </h4>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {task.tsk_assignees.map((assignee) => (
                    <BriefEmployeeCard employee={assignee} key={assignee.id} />
                  ))}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-200 pt-6'>
              <div>
                <Label className='text-gray-700 font-semibold mb-2 block'>
                  Tạo lúc
                </Label>
                <Input
                  value={formatDate(task.createdAt, 'HH:mm - DD/MM/YYYY')}
                  readOnly
                  className='bg-gray-50 border-gray-300'
                />
              </div>
              <div>
                <Label className='text-gray-700 font-semibold mb-2 block'>
                  Cập nhật lúc
                </Label>
                <Input
                  value={formatDate(task.updatedAt, 'HH:mm - DD/MM/YYYY')}
                  readOnly
                  className='bg-gray-50 border-gray-300'
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </Defer>
  );
}
