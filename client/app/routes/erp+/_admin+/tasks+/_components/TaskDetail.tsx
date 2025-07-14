import { Link } from '@remix-run/react';
import BriefEmployeeCard from '~/components/BriefEmployeeCard';
import Defer from '~/components/Defer';
import LoadingCard from '~/components/LoadingCard';
import ErrorCard from '~/components/ErrorCard';
import TextRenderer from '~/components/TextRenderer';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import {
  TASK,
  TASK_PRIORITY_BADGE_CLASSES,
  TASK_STATUS_BADGE_CLASSES,
} from '~/constants/task.constant';
import { ILoaderDataPromise } from '~/interfaces/app.interface';
import { ITask } from '~/interfaces/task.interface';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  CheckSquare,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Users,
  FileText,
  Flag,
  Play,
  Edit,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '~/components/ui/button';

export default function TaskDetail({
  taskPromise,
}: {
  taskPromise: ILoaderDataPromise<ITask>;
}) {
  return (
    <Defer resolve={taskPromise} fallback={<LoadingCard />}>
      {(task) => {
        if (!task || 'success' in task) {
          return (
            <ErrorCard
              message={
                task && 'message' in task && typeof task.message === 'string'
                  ? task.message
                  : 'Đã xảy ra lỗi khi tải dữ liệu công việc'
              }
            />
          );
        }

        return (
          <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200'>
            <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white py-6 rounded-t-xl'>
              <div className='flex items-center space-x-4'>
                <div className='w-16 h-16 bg-white/20 rounded-full flex items-center justify-center'>
                  <CheckSquare className='w-8 h-8 text-white' />
                </div>
                <div>
                  <CardTitle className='text-white text-3xl font-bold'>
                    {task.tsk_name}
                  </CardTitle>
                  <p className='text-orange-100 text-lg'>ID: {task.id}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className='p-6 space-y-6'>
              {/* Basic Information */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-4'>
                  <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
                    <FileText className='w-5 h-5 mr-2' />
                    Thông tin cơ bản
                  </h3>

                  <div className='space-y-3'>
                    <div className='flex items-center space-x-3'>
                      <Flag className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>Ưu tiên:</span>
                      <Badge
                        className={`text-sm ${TASK_PRIORITY_BADGE_CLASSES[task.tsk_priority]}`}
                      >
                        {TASK.PRIORITY[task.tsk_priority]}
                      </Badge>
                    </div>

                    <div className='flex items-center space-x-3'>
                      <CheckCircle className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>Trạng thái:</span>
                      <Badge
                        className={`text-sm ${TASK_STATUS_BADGE_CLASSES[task.tsk_status]}`}
                      >
                        {TASK.STATUS[task.tsk_status]}
                      </Badge>
                    </div>

                    <div className='flex items-center space-x-3'>
                      <Calendar className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>Ngày tạo:</span>
                      <span className='text-sm font-medium'>
                        {task.createdAt
                          ? format(
                              new Date(task.createdAt),
                              'dd/MM/yyyy HH:mm',
                              { locale: vi },
                            )
                          : 'Không có thông tin'}
                      </span>
                    </div>

                    <div className='flex items-center space-x-3'>
                      <Calendar className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>
                        Cập nhật lúc:
                      </span>
                      <span className='text-sm font-medium'>
                        {task.updatedAt
                          ? format(
                              new Date(task.updatedAt),
                              'dd/MM/yyyy HH:mm',
                              { locale: vi },
                            )
                          : 'Không có thông tin'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Task Timeline */}
                <div className='space-y-4'>
                  <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
                    <Clock className='w-5 h-5 mr-2' />
                    Thời gian thực hiện
                  </h3>

                  <div className='space-y-3'>
                    <div className='flex items-center space-x-3'>
                      <Play className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>
                        Ngày bắt đầu:
                      </span>
                      <span className='text-sm font-medium'>
                        {task.tsk_startDate
                          ? format(
                              new Date(task.tsk_startDate),
                              'HH:mm - dd/MM/yyyy',
                              {
                                locale: vi,
                              },
                            )
                          : 'Chưa có thông tin'}
                      </span>
                    </div>

                    <div className='flex items-center space-x-3'>
                      <CheckCircle className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>
                        Ngày kết thúc:
                      </span>
                      <span className='text-sm font-medium'>
                        {task.tsk_endDate
                          ? format(
                              new Date(task.tsk_endDate),
                              'HH:mm - dd/MM/yyyy',
                              {
                                locale: vi,
                              },
                            )
                          : 'Chưa kết thúc'}
                      </span>
                    </div>

                    {task.tsk_caseService && (
                      <div className='flex items-center space-x-3'>
                        <FileText className='w-4 h-4 text-gray-400' />
                        <span className='text-sm text-gray-500'>Hồ sơ:</span>
                        <Link
                          to={`/erp/crm/cases/${task.tsk_caseService.id}`}
                          className='text-sm font-medium text-blue-600 hover:underline'
                        >
                          {task.tsk_caseService.case_code}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Task Description */}
              {task.tsk_description && (
                <div className='space-y-3'>
                  <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
                    <FileText className='w-5 h-5 mr-2' />
                    Mô tả công việc
                  </h3>
                  <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
                    <TextRenderer content={task.tsk_description} />
                  </div>
                </div>
              )}

              {/* Assignees */}
              {task.tsk_assignees && task.tsk_assignees.length > 0 && (
                <div className='space-y-4'>
                  <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
                    <Users className='w-5 h-5 mr-2' />
                    Nhân viên phụ trách
                  </h3>
                  <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                    {task.tsk_assignees.map((assignee) => (
                      <BriefEmployeeCard
                        employee={assignee}
                        key={assignee.id}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className='flex flex-wrap gap-3 pt-4 border-t border-gray-200'>
                <Button asChild variant={'primary'}>
                  <Link to='./edit'>
                    <Edit />
                    Chỉnh sửa công việc
                  </Link>
                </Button>

                <Button asChild variant={'secondary'}>
                  <Link to='/erp/tasks'>
                    <ArrowLeft />
                    Quay lại danh sách
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      }}
    </Defer>
  );
}
