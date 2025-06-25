import {
  Link,
  useLocation,
  data as dataResponse,
  useLoaderData,
} from '@remix-run/react';

import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { isAuthenticated } from '~/services/auth.server';
import { createTask } from '~/services/task.server';
import { toast } from 'react-toastify';
import { ITaskCreate } from '~/interfaces/task.interface';
import TaskDetailForm from './_components/TaskDetailForm';
import ContentHeader from '~/components/ContentHeader';
import { parseAuthCookie } from '~/services/cookie.server';
import { getEmployees } from '~/services/employee.server';
import { TASK } from '~/constants/task.constant';
import { getCaseServiceById } from '~/services/case.server';

// Định nghĩa kiểu cho toast
type ToastType = 'success' | 'error' | 'info' | 'warning';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const auth = await parseAuthCookie(request);
  const url = new URL(request.url);
  const caseId = url.searchParams.get('caseId');
  const page = Number(url.searchParams.get('page')) || 1;
  const limit = Number(url.searchParams.get('limit')) || 100;

  const employeesPromise = getEmployees(
    {},
    {
      page,
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
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
  const location = useLocation();
  const actionData = location.state?.actionData;

  // Hiển thị thông báo nếu có
  if (actionData?.toast) {
    const toastType = actionData.toast.type as ToastType;
    toast[toastType](actionData.toast.message);
  }

  const formId = 'task-detail-form';

  return (
    <div className='w-full space-y-6'>
      {/* Content Header */}
      <ContentHeader
        title='Thêm mới Task'
        actionContent={
          <>
            <span className='material-symbols-outlined text-sm mr-1'>save</span>
            Lưu Task
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
      <TaskDetailForm
        employees={employeesPromise}
        formId={formId}
        type='create'
        casePromise={casePromise}
      />
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
