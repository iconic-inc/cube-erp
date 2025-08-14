import {
  LoaderFunctionArgs,
  redirect,
  ActionFunctionArgs,
  data,
} from '@remix-run/node';

import { deleteTask, getTaskById, patchTask } from '~/services/task.server';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { parseAuthCookie } from '~/services/cookie.server';
import ContentHeader from '~/components/ContentHeader';
import TaskDetail from './_components/TaskDetail';
import { Edit, Pencil } from 'lucide-react';
import { IActionFunctionReturn } from '../../../../interfaces/app.interface';
import { isAuthenticated } from '~/services/auth.server';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await parseAuthCookie(request);

  // Fetch task details from the API
  const taskId = params.taskId as string;
  const task = getTaskById(taskId, user!).catch((error) => {
    console.error('Error fetching task:', error.message);
    return {
      success: false,
      message:
        (error.message as string) || 'Có lỗi xảy ra khi lấy thông tin tài liệu',
    };
  });

  return { task };
};

export default function TaskDetailPage() {
  const { task } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <div className='space-y-4 md:space-y-6 min-h-screen p-2 sm:p-4 md:p-0'>
      <ContentHeader
        title='Chi tiết Task'
        actionContent={
          <>
            <Edit className='h-3 w-3 md:h-4 md:w-4' />
            <span className='hidden sm:inline'>Sửa Task</span>
            <span className='sm:hidden'>Sửa</span>
          </>
        }
        actionHandler={() => {
          // Navigate to the edit page
          navigate(`./edit`);
        }}
        backHandler={() => navigate('/erp/tasks')}
      />

      <TaskDetail taskPromise={task} />
    </div>
  );
}

export const action = async ({
  params,
  request,
}: ActionFunctionArgs): IActionFunctionReturn => {
  const { session, headers } = await isAuthenticated(request);
  const taskId = params.taskId as string;

  if (!session) {
    return data(
      {
        success: false,
        toast: { message: 'Unauthorized', type: 'error' },
      },
      { headers, status: 401 },
    );
  }

  switch (request.method) {
    case 'DELETE':
      try {
        await deleteTask(taskId, session);
        return data(
          {
            success: true,
            toast: {
              message: 'Xóa Task thành công!',
              type: 'success',
            },
            redirectTo: '/erp/tasks',
          },
          { headers },
        );
      } catch (error: any) {
        console.error('Error deleting task:', error);
        return data(
          {
            success: false,
            toast: {
              message: 'Có lỗi xảy ra khi xóa Task',
              type: 'error',
            },
          },
          { headers, status: 500 },
        );
      }

    case 'PATCH':
      try {
        const formData = await request.formData();
        const res = await patchTask(
          taskId,
          { op: formData.get('op') as string, value: formData.get('value') },
          session!,
        );

        return data(
          {
            success: true,
            toast: {
              message: 'Cập nhật Task thành công!',
              type: 'success',
            },
          },
          { headers },
        );
      } catch (error: any) {
        console.error('Error updating task:', error);
        let errorMessage = 'Có lỗi xảy ra khi cập nhật Task';

        return data(
          {
            success: false,
            toast: {
              message: errorMessage,
              type: 'error',
            },
          },
          { headers, status: 500 },
        );
      }

    default:
      return data(
        {
          success: false,
          toast: { message: 'Method not allowed', type: 'error' },
        },
        { headers, status: 405 },
      );
  }
};
