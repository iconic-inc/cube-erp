import {
  Link,
  useLoaderData,
  data as dataResponse,
  useFetcher,
} from '@remix-run/react';
import { useMemo, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { isAuthenticated } from '~/services/auth.server';
import { createTask } from '~/services/task.server';
import { ITaskCreate } from '~/interfaces/task.interface';
import TaskDetailForm from './_components/TaskDetailForm';
import ContentHeader from '~/components/ContentHeader';
import { parseAuthCookie } from '~/services/cookie.server';
import { getEmployees } from '~/services/employee.server';
import { TASK } from '~/constants/task.constant';
import { getCaseServiceById } from '~/services/case.server';
import { generateFormId } from '~/utils';
import { Save } from 'lucide-react';

// Định nghĩa kiểu cho toast
type ToastType = 'success' | 'error' | 'info' | 'warning';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const auth = await parseAuthCookie(request);
  const url = new URL(request.url);
  const caseId = url.searchParams.get('caseId');
  const page = Number(url.searchParams.get('page')) || 1;
  const limit = Number(url.searchParams.get('limit')) || 100;

  const employeesPromise = getEmployees(
    new URLSearchParams([
      ['page', page.toString()],
      ['limit', limit.toString()],
      ['sortBy', 'createdAt'],
      ['sortOrder', 'desc'],
    ]),
    auth!,
  ).catch((e) => {
    console.error('Error fetching employees:', e);
    return {
      success: false,
      message: 'Xảy ra lỗi khi lấy danh sách nhân viên',
    };
  });

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
    employeesPromise,
    casePromise,
  };
};

export default function NewTask() {
  const { employeesPromise, casePromise } = useLoaderData<typeof loader>();

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
          employees={employeesPromise}
          formId={formId}
          type='create'
          casePromise={casePromise}
        />
      </div>
    </div>
  );
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, headers } = await isAuthenticated(request);

  switch (request.method) {
    case 'POST': {
      try {
        const formData = await request.formData();

        // Lấy danh sách assignees (có thể có nhiều giá trị)
        const assignees = formData.getAll('assignees') as string[];

        // Tạo dữ liệu từ form
        const data: ITaskCreate = {
          name: formData.get('name') as string,
          assignees,
          description: formData.get('description') as string,
          startDate: formData.get('startDate') as string,
          endDate: formData.get('endDate') as string,
          status: formData.get('status') as keyof typeof TASK.STATUS,
          priority: formData.get('priority') as keyof typeof TASK.PRIORITY,
          caseService: formData.get('caseService') as string,
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

        const res = await createTask(data, session!);

        return dataResponse(
          {
            task: res,
            toast: {
              message: 'Thêm mới Task thành công!',
              type: 'success' as ToastType,
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
