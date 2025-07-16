import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  data as dataResponse,
} from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { useMemo } from 'react';

import TaskDetailForm from './_components/TaskDetailForm';
import ContentHeader from '~/components/ContentHeader';
import { parseAuthCookie } from '~/services/cookie.server';
import { getEmployees } from '~/services/employee.server';
import { getTaskById, updateTask } from '~/services/task.server';
import { isAuthenticated } from '~/services/auth.server';
import { ITaskUpdate } from '~/interfaces/task.interface';
import { TASK } from '~/constants/task.constant';
import { generateFormId } from '~/utils';
import { Save } from 'lucide-react';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const auth = await parseAuthCookie(request);

  const taskId = params.taskId as string;
  if (!taskId) {
    throw new Response('Không tìm thấy Task', { status: 404 });
  }
  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.searchParams);
  searchParams.set('sortBy', 'createdAt');
  searchParams.set('sortOrder', 'desc');

  const employeesPromise = getEmployees(searchParams, auth!).catch((e) => {
    console.error('Error fetching employees:', e);
    return {
      success: false,
      message: 'Xảy ra lỗi khi lấy danh sách nhân viên',
    };
  });
  const taskPromise = getTaskById(taskId, auth!).catch((e) => {
    console.error('Error fetching task:', e);
    return {
      success: false,
      message: 'Xảy ra lỗi khi lấy thông tin Task',
    };
  });

  // Trả về dữ liệu cần thiết cho trang TaskEdit
  return {
    employeesPromise,
    taskPromise,
  };
};

export default function TaskEdit() {
  const { employeesPromise, taskPromise } = useLoaderData<typeof loader>();
  const formId = useMemo(() => generateFormId('task-update-form'), []);

  return (
    <div className='space-y-4 sm:space-y-6 min-h-screen mx-auto'>
      {/* Content Header */}
      <ContentHeader
        title='Chỉnh sửa Task'
        actionContent={
          <>
            <Save className='h-4 w-4' />
            <span className='hidden sm:inline'>Cập nhật Task</span>
            <span className='sm:hidden'>Cập nhật</span>
          </>
        }
        actionHandler={() => {
          const form = document.getElementById(formId) as HTMLFormElement;
          if (form) {
            form.requestSubmit();
          }
        }}
      />

      {/* Form Container */}
      <div className='mt-4 sm:mt-8'>
        <TaskDetailForm
          formId={formId}
          type='update'
          employees={employeesPromise}
          taskPromise={taskPromise}
        />
      </div>
    </div>
  );
}

type ToastType = 'success' | 'error' | 'info' | 'warning';

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session, headers } = await isAuthenticated(request);

  const taskId = params.taskId as string;
  if (!taskId) {
    return dataResponse(
      {
        task: null,
        toast: {
          message: 'Không tìm thấy Task',
          type: 'error' as ToastType,
        },
        redirectTo: null,
      },
      { headers, status: 404 },
    );
  }

  switch (request.method) {
    case 'PUT': {
      try {
        const formData = await request.formData();

        // Lấy danh sách assignees (có thể có nhiều giá trị)
        const assignees = formData.getAll('assignees') as string[];

        // Tạo dữ liệu từ form
        const data: ITaskUpdate = {
          name: formData.get('name') as string,
          assignees,
          description: formData.get('description') as string,
          startDate: formData.get('startDate') as string,
          endDate: formData.get('endDate') as string,
          status: formData.get('status') as keyof typeof TASK.STATUS,
          priority: formData.get('priority') as keyof typeof TASK.PRIORITY,
          caseOrder: +(formData.get('caseOrder') as string) || 0,
        };

        // Kiểm tra dữ liệu bắt buộc
        if (
          !data.name ||
          !data.endDate ||
          !data.assignees?.length ||
          !data.status ||
          !data.priority
        ) {
          return dataResponse(
            {
              task: null,
              toast: {
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc',
                type: 'error' as ToastType,
              },
              redirectTo: null,
            },
            { headers, status: 400 },
          );
        }

        const res = await updateTask(taskId, data, session!);

        return dataResponse(
          {
            task: res,
            toast: {
              message: 'Cập nhật Task thành công!',
              type: 'success' as ToastType,
            },
            redirectTo: `/erp/tasks/${res.id}`,
          },
          { headers },
        );
      } catch (error: any) {
        console.error('Error creating task:', error);

        let errorMessage = 'Có lỗi xảy ra khi cập nhật Task';

        return dataResponse(
          {
            task: null,
            toast: {
              message: errorMessage,
              type: 'error' as ToastType,
            },
            redirectTo: null,
          },
          { headers, status: 500 },
        );
      }
    }

    default:
      return dataResponse(
        {
          task: null,
          toast: { message: 'Method not allowed', type: 'error' as ToastType },
          redirectTo: null,
        },
        { headers, status: 405 },
      );
  }
};
