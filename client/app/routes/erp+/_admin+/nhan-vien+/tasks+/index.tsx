import { ActionFunctionArgs, data, LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useNavigate, Link } from '@remix-run/react';
import { useState } from 'react';
import { Plus } from 'lucide-react';

import { bulkDeleteTasks, getMyTasks, getTasks } from '~/services/task.server';
import ContentHeader from '~/components/ContentHeader';
import { parseAuthCookie } from '~/services/cookie.server';
import { ITask } from '~/interfaces/task.interface';
import { IListResponse } from '~/interfaces/response.interface';
import { IListColumn } from '~/interfaces/app.interface';
import { isAuthenticated } from '~/services/auth.server';
import List from '~/components/List';
import {
  TASK,
  TASK_PRIORITY_BADGE_CLASSES,
  TASK_STATUS_BADGE_CLASSES,
} from '~/constants/task.constant';
import { formatDate } from '~/utils';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await parseAuthCookie(request);

  const url = new URL(request.url);
  const page = Number(url.searchParams.get('page')) || 1;
  const limit = Number(url.searchParams.get('limit')) || 10;
  const searchQuery = url.searchParams.get('search') || '';

  const sortBy = url.searchParams.get('sortBy') || 'createdAt';
  const sortOrder =
    (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

  // Build a clean query object that matches the expected API format
  const query: any = {};

  // Search query - used for name, phone, email search
  if (searchQuery) {
    query.search = searchQuery;
  }
  // Pagination options
  const options = {
    page,
    limit,
    sortBy,
    sortOrder,
  };

  return {
    tasksPromise: getMyTasks({ ...query }, options, user!).catch((e) => {
      console.error('Error getting my tasks: ', e);
      return {
        success: false,
        message: e.message || 'Có lỗi xảy ra khi lấy danh sách Task',
      };
    }),
  };
};

export default function HRMTasks() {
  const { tasksPromise } = useLoaderData<typeof loader>();

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
            to={`/erp/crm/cases/${task.tsk_caseService?.id}`}
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
      render: (task) => formatDate(task.tsk_startDate),
    },
    {
      key: 'tsk_endDate',
      title: 'Ngày kết thúc',
      visible: true,
      sortField: 'tsk_endDate',
      render: (task) => formatDate(task.tsk_endDate),
    },
    {
      key: 'tsk_priority',
      title: 'Ưu tiên',
      visible: true,
      sortField: 'tsk_priority',
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
            <Plus className='w-4 h-4 mr-2' />
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
