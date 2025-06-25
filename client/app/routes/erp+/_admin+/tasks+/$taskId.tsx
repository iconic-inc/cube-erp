import { LoaderFunctionArgs } from '@remix-run/node';

import { getTaskById } from '~/services/task.server';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { parseAuthCookie } from '~/services/cookie.server';
import ContentHeader from '~/components/ContentHeader';
import TaskDetail from './_components/TaskDetail';
import { Pencil } from 'lucide-react';

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
    <div className='space-y-6'>
      <ContentHeader
        title='Chi tiết Task'
        actionContent={
          <>
            <Pencil />
            <span className='hidden md:inline'>Sửa Task</span>
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
