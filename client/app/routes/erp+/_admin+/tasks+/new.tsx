import { useLoaderData, data as dataResponse } from '@remix-run/react';
import { useMemo, useEffect, useRef } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { isAuthenticated } from '~/services/auth.server';
import { createTask } from '~/services/task.server';
import { ITaskCreate } from '~/interfaces/task.interface';
import TaskDetailForm from './_components/TaskDetailForm';
import ContentHeader from '~/components/ContentHeader';
import {
  getUnauthorizedActionResponse,
  parseAuthCookie,
} from '~/services/cookie.server';
import { TASK } from '~/constants/task.constant';
import { getCaseServiceById } from '~/services/case.server';
import { generateFormId } from '~/utils';
import { Save } from 'lucide-react';
import { IActionFunctionReturn } from '~/interfaces/app.interface';

// Định nghĩa kiểu cho toast
type ToastType = 'success' | 'error' | 'info' | 'warning';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const auth = await parseAuthCookie(request);
  const url = new URL(request.url);
  const caseId = url.searchParams.get('caseId');

  const casePromise = caseId
    ? getCaseServiceById(caseId, auth!).catch((e) => {
        console.error('Error fetching case:', e);
        return {
          success: false,
          message: 'Xảy ra lỗi khi lấy thông tin Case',
        };
      })
    : undefined;

  // Trả về dữ liệu cần thiết cho trang NewTask
  return {
    casePromise,
  };
};

export default function NewTask() {
  const { casePromise } = useLoaderData<typeof loader>();

  const formId = useMemo(() => generateFormId('task-detail-form'), []);
  return (
    <div className='space-y-4 sm:space-y-6 min-h-screen mx-auto'>
      {/* Content Header */}
      <ContentHeader
        title='Thêm mới Task'
        actionContent={
          <>
            <Save className='h-4 w-4' />
            <span className='hidden sm:inline'>Lưu Task</span>
            <span className='sm:hidden'>Lưu</span>
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
          type='create'
          casePromise={casePromise}
        />
      </div>
    </div>
  );
}

export const action = async ({
  request,
}: ActionFunctionArgs): IActionFunctionReturn => {
  const { session, headers } = await isAuthenticated(request);
  if (!session) {
    return getUnauthorizedActionResponse(dataResponse, headers);
  }

  switch (request.method) {
    case 'POST': {
      try {
        const formData = await request.formData();

        // Tạo dữ liệu từ form
        const data: ITaskCreate = {
          name: formData.get('name') as string,
          description: formData.get('description') as string,
          startDate: formData.get('startDate') as string,
          endDate: formData.get('endDate') as string,
          status: formData.get('status') as keyof typeof TASK.STATUS,
          priority: formData.get('priority') as keyof typeof TASK.PRIORITY,
          caseService: formData.get('caseService') as string,
          caseOrder: +(formData.get('caseOrder') as string) || 0,
          assignees: formData.getAll('assignees') as string[],
        };

        // Kiểm tra dữ liệu bắt buộc
        if (!data.name || !data.endDate || !data.status || !data.priority) {
          return dataResponse(
            {
              success: false,
              toast: {
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc',
                type: 'error',
              },
            },
            { headers, status: 400 },
          );
        }

        const res = await createTask(data, session!);

        return dataResponse(
          {
            success: true,
            toast: {
              message: 'Thêm mới Task thành công!',
              type: 'success',
            },
            redirectTo: `/erp/tasks/${res.id}`,
          },
          { headers },
        );
      } catch (error: any) {
        console.error('Error creating task:', error);

        let errorMessage = 'Có lỗi xảy ra khi thêm Task';

        return dataResponse(
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
    }

    default:
      return dataResponse(
        {
          success: false,
          toast: { message: 'Method not allowed', type: 'error' },
        },
        { headers, status: 405 },
      );
  }
};
