import {
  ActionFunctionArgs,
  data,
  LoaderFunctionArgs,
  redirect,
} from '@remix-run/node';
import { useLoaderData, useNavigate, Link } from '@remix-run/react';
import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';

import { bulkDeleteTasks, getTasks } from '~/services/task.server';
import ContentHeader from '~/components/ContentHeader';
import { parseAuthCookie } from '~/services/cookie.server';
import { ITask } from '~/interfaces/task.interface';
import { IListColumn } from '~/interfaces/app.interface';
import { isAuthenticated } from '~/services/auth.server';
import List from '~/components/List';
import {
  TASK,
  TASK_PRIORITY_BADGE_CLASSES,
  TASK_STATUS_BADGE_CLASSES,
} from '~/constants/task.constant';
import { formatDate } from '~/utils';
import { isAdmin } from '~/utils/permission';
import { getEmployees } from '~/services/employee.server';
import { isResolveError } from '~/lib';
import { IEmployeeBrief } from '~/interfaces/employee.interface';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await parseAuthCookie(request);
  if (!isAdmin(user?.user.usr_role)) {
    return redirect('/erp/nhan-vien/tasks');
  }

  const url = new URL(request.url);

  return {
    tasksPromise: getTasks(url.searchParams, user!).catch((e) => {
      console.error(e);
      return {
        success: false,
        message: e.message || 'Có lỗi xảy ra khi lấy danh sách Task',
      };
    }),
    employeesPromise: getEmployees(
      new URLSearchParams([['limit', '1000']]),
      user!,
    ).catch((e) => {
      console.error(e);
      return {
        success: false,
        message: e.message || 'Có lỗi xảy ra khi lấy danh sách nhân viên',
      };
    }),
  };
};

export default function HRMTasks() {
  const { tasksPromise, employeesPromise } = useLoaderData<typeof loader>();

  useEffect(() => {
    const loadEmployees = async () => {
      const employeesData = (await employeesPromise) as any;
      if (isResolveError(employeesData)) {
        console.error('Error loading employees:', employeesData.message);
        return;
      }
      setVisibleColumns((prevColumns) =>
        prevColumns.map((col) => {
          if (col.key === 'tsk_assignees') {
            return {
              ...col,
              options: employeesData.data.length
                ? employeesData.data.map((emp: IEmployeeBrief) => ({
                    value: emp.id,
                    label: `${emp.emp_user?.usr_firstName} ${emp.emp_user?.usr_lastName}`,
                  }))
                : [
                    {
                      value: '',
                      label: 'Không có nhân viên',
                    },
                  ],
            };
          }
          return col;
        }),
      ); // Trigger re-render to update options
    };
    loadEmployees();
  }, [employeesPromise]);

  const [visibleColumns, setVisibleColumns] = useState<IListColumn<ITask>[]>([
    {
      key: 'tsk_name',
      title: 'Tên Task',
      visible: true,
      sortField: 'tsk_name',
      render: (task) => (
        <Link
          to={`/erp/tasks/${task.id}`}
          className='text-blue-600 hover:underline py-2'
        >
          {task.tsk_name}
        </Link>
      ),
    },
    {
      key: 'tsk_assignees',
      title: 'Người thực hiện',
      visible: true,
      sortField: 'tsk_assignees',
      filterField: 'assignee',
      options: [],
      render: (task) => (
        <span>
          {task.tsk_assignees
            .map(({ emp_user: user }) => `${user?.usr_firstName}`)
            .join(', ')}
        </span>
      ),
    },
    {
      key: 'tsk_caseService',
      title: 'Mã Hồ sơ',
      visible: true,
      sortField: 'tsk_caseService.case_code',
      render: (task) =>
        task.tsk_caseService ? (
          <Link
            to={`/erp/cases/${task.tsk_caseService?.id}`}
            className='text-blue-600 hover:underline'
          >
            {task.tsk_caseService?.case_code}
          </Link>
        ) : (
          '-'
        ),
    },
    {
      key: 'tsk_startDate',
      title: 'Ngày bắt đầu',
      visible: true,
      sortField: 'tsk_startDate',
      filterField: 'startDate',
      dateFilterable: true,
      render: (task) => formatDate(task.tsk_startDate, 'HH:mm - DD/MM/YYYY'),
    },
    {
      key: 'tsk_endDate',
      title: 'Ngày kết thúc',
      visible: true,
      sortField: 'tsk_endDate',
      filterField: 'endDate',
      dateFilterable: true,
      render: (task) => formatDate(task.tsk_endDate, 'HH:mm - DD/MM/YYYY'),
    },
    {
      key: 'tsk_priority',
      title: 'Ưu tiên',
      visible: true,
      sortField: 'tsk_priority',
      filterField: 'priority',
      options: Object.keys(TASK.PRIORITY).map((key) => ({
        value: key,
        label: TASK.PRIORITY[key as keyof typeof TASK.PRIORITY],
      })),
      render: (task) => (
        <span className={`${TASK_PRIORITY_BADGE_CLASSES[task.tsk_priority]}`}>
          {TASK.PRIORITY[task.tsk_priority]}
        </span>
      ),
    },
    {
      key: 'tsk_status',
      title: 'Trạng thái',
      visible: true,
      sortField: 'tsk_status',
      filterField: 'status',
      options: Object.keys(TASK.STATUS).map((key) => ({
        value: key,
        label: TASK.STATUS[key as keyof typeof TASK.STATUS],
      })),
      render: (task) => (
        <span className={`${TASK_STATUS_BADGE_CLASSES[task.tsk_status]}`}>
          {TASK.STATUS[task.tsk_status]}
        </span>
      ),
    },
  ]);

  const navigate = useNavigate();

  return (
    <div className='space-y-4 md:space-y-6 min-h-screen'>
      {/* Content Header */}
      <ContentHeader
        title='Danh sách Task'
        actionContent={
          <>
            <Plus className='w-4 h-4' />
            Thêm Task
          </>
        }
        actionHandler={() => navigate('/erp/tasks/new')}
      />

      <List<ITask>
        itemsPromise={tasksPromise}
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns}
        addNewHandler={() => navigate('/erp/tasks/new')}
        name='Task'
      />
    </div>
  );
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, headers } = await isAuthenticated(request);
  if (!session) {
    return data(
      {
        success: false,
        toast: {
          type: 'error',
          message: 'Bạn cần đăng nhập để thực hiện hành động này',
        },
      },
      { headers },
    );
  }

  try {
    const formData = await request.formData();
    switch (request.method) {
      case 'DELETE':
        const taskIdsString = formData.get('itemIds') as string;
        if (!taskIdsString) {
          return data(
            {
              success: false,
              toast: {
                message: 'Không có Task nào được chọn để xóa',
                type: 'error',
              },
            },
            { headers },
          );
        }

        const taskIds = JSON.parse(taskIdsString);
        if (!Array.isArray(taskIds) || taskIds.length === 0) {
          return data(
            {
              success: false,
              toast: {
                message: 'Không có Task nào được chọn để xóa',
                type: 'error',
              },
            },
            { headers },
          );
        }
        // Call the bulk delete function
        await bulkDeleteTasks(taskIds, session);

        return data(
          {
            success: true,
            toast: {
              message: `Đã xóa ${taskIds.length} Task thành công`,
              type: 'success',
            },
          },
          { headers },
        );

      default:
        return data(
          {
            success: false,
            toast: { message: 'Phương thức không hợp lệ', type: 'error' },
          },

          { headers },
        );
    }
  } catch (error: any) {
    console.error('Action error:', error);
    return data(
      {
        success: false,
        toast: {
          message: error.message || 'Có lỗi xảy ra khi thực hiện hành động',
          type: 'error',
        },
      },
      { headers },
    );
  }
};
