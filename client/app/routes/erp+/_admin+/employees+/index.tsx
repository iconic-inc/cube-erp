import { ActionFunctionArgs, data, LoaderFunctionArgs } from '@remix-run/node';
import { Link, useLoaderData, useNavigate } from '@remix-run/react';
import { useState } from 'react';
import { Plus } from 'lucide-react';

import {
  bulkDeleteEmployees,
  exportEmployees,
  getEmployees,
} from '~/services/employee.server';
import ContentHeader from '~/components/ContentHeader';
import { parseAuthCookie } from '~/services/cookie.server';
import { IEmployee } from '~/interfaces/employee.interface';
import { IListResponse } from '~/interfaces/response.interface';
import {
  IActionFunctionReturn,
  IExportResponse,
  IListColumn,
} from '~/interfaces/app.interface';
import { isAuthenticated } from '~/services/auth.server';
import List from '~/components/List';
import { Badge } from '~/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '~/components/ui/avatar';
import { canAccessEmployeeManagement } from '~/utils/permission';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await parseAuthCookie(request);

  if (!canAccessEmployeeManagement(user?.user.usr_role)) {
    throw new Response('Bạn không có quyền truy cập vào trang này.', {
      status: 403,
    });
  }

  const url = new URL(request.url);
  return {
    employeesPromise: getEmployees(url.searchParams, user!).catch((e) => {
      console.error(e);
      return {
        data: [],
        pagination: {
          totalPages: 0,
          page: 1,
          limit: 10,
          total: 0,
        },
      } as IListResponse<IEmployee>;
    }),
  };
};

export default function HRMEmployees() {
  const { employeesPromise } = useLoaderData<typeof loader>();

  const [visibleColumns, setVisibleColumns] = useState<
    IListColumn<IEmployee>[]
  >([
    {
      title: 'Tên nhân viên',
      key: 'name',
      visible: true,
      sortField: 'emp_user.usr_firstName',
      render: (item) => (
        <Link
          to={`/erp/employees/${item.id}`}
          className='text-blue-600 hover:underline flex items-center'
        >
          <Avatar className='w-6 h-6 sm:w-8 sm:h-8 mr-2 shrink-0'>
            <AvatarImage
              src={
                item.emp_user.usr_avatar?.img_url ||
                '/assets/avatar-placeholder.png'
              }
              alt={`${item.emp_user.usr_firstName} ${item.emp_user.usr_lastName}`}
            />
            <AvatarFallback className='bg-gray-200 text-gray-600 font-bold text-xs sm:text-sm'>
              {item.emp_user.usr_firstName?.charAt(0).toUpperCase() || 'N/A'}
            </AvatarFallback>
          </Avatar>
          <div className='flex flex-col min-w-0 flex-1'>
            <span className='text-sm sm:text-base font-medium truncate'>
              {item.emp_user.usr_firstName} {item.emp_user.usr_lastName}
            </span>
            <span className='text-gray-500 text-xs sm:text-sm truncate'>
              {item.emp_code || 'Chưa có mã'}
            </span>
          </div>
        </Link>
      ),
    },
    {
      title: 'Phòng ban',
      key: 'department',
      visible: true,
      sortField: 'emp_department',
      filterField: 'department',
      options: (item) => {
        return { label: item.emp_department, value: item.emp_department };
      },
      render: (item) => (
        <Badge
          variant='secondary'
          className='text-xs sm:text-sm whitespace-nowrap'
        >
          {item.emp_department || 'Chưa có phòng ban'}
        </Badge>
      ),
    },
    {
      title: 'Chức vụ',
      key: 'position',
      visible: true,
      sortField: 'emp_position',
      filterField: 'position',
      options: (item) => {
        return { label: item.emp_position, value: item.emp_position };
      },
      render: (item) => (
        <Badge
          variant='outline'
          className='text-xs sm:text-sm whitespace-nowrap'
        >
          {item.emp_position || 'Chưa có chức vụ'}
        </Badge>
      ),
    },
    {
      title: 'Số điện thoại',
      key: 'phone',
      visible: true,
      sortField: 'emp_user.usr_msisdn',
      render: (item) => (
        <span className='text-gray-600 text-xs sm:text-sm truncate block max-w-[120px] sm:max-w-none'>
          {item.emp_user.usr_msisdn || 'Chưa có số điện thoại'}
        </span>
      ),
    },
    {
      title: 'Email',
      key: 'email',
      visible: true,
      sortField: 'emp_user.usr_email',
      render: (item) => (
        <span className='text-gray-600 text-xs sm:text-sm truncate block max-w-[150px] sm:max-w-none'>
          {item.emp_user.usr_email || 'Chưa có email'}
        </span>
      ),
    },
  ]);

  const navigate = useNavigate();

  return (
    <div className='space-y-4 md:space-y-6 min-h-screen'>
      {/* Content Header */}

      <ContentHeader
        title='Danh sách Nhân viên'
        actionContent={
          <>
            <Plus className='w-4 h-4' />
            <span className='hidden sm:inline'>Thêm Nhân viên</span>
            <span className='sm:hidden'>Thêm</span>
          </>
        }
        actionHandler={() => navigate('/erp/employees/new')}
      />

      <List<IEmployee>
        itemsPromise={employeesPromise}
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns}
        addNewHandler={() => navigate('/erp/employees/new')}
        exportable
        name='Nhân viên'
      />
    </div>
  );
}

export const action = async ({
  request,
}: ActionFunctionArgs): IActionFunctionReturn<IExportResponse> => {
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
        const employeeIdsString = formData.get('itemIds') as string;
        if (!employeeIdsString) {
          return data(
            {
              success: false,
              toast: {
                message: 'Không có nhân viên nào được chọn để xóa',
                type: 'error',
              },
            },
            { headers },
          );
        }

        const employeeIds = JSON.parse(employeeIdsString);
        if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
          return data(
            {
              success: false,
              toast: {
                message: 'Không có nhân viên nào được chọn để xóa',
                type: 'error',
              },
            },
            { headers },
          );
        }
        // Call the bulk delete function
        await bulkDeleteEmployees(employeeIds, session);

        return data(
          {
            success: true,
            toast: {
              type: 'success',
              message: `Đã xóa ${employeeIds.length} thành công`,
            },
          },
          { headers },
        );

      case 'POST':
        // Handle export action
        const fileType = formData.get('fileType') as string;
        if (!fileType || !['xlsx'].includes(fileType)) {
          return data(
            {
              success: false,
              toast: { type: 'error', message: 'Định dạng file không hợp lệ.' },
            },
            { headers },
          );
        }

        const url = new URL(request.url);
        const fileData = await exportEmployees(
          url.searchParams,
          fileType as 'xlsx',
          session,
        );
        return data(
          {
            success: true,
            toast: {
              type: 'success',
              message: `Đã xuất dữ liệu Nhân viên thành công!`,
            },
            data: {
              fileUrl: fileData.fileUrl,
              fileName: fileData.fileName,
              count: fileData.count,
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
