import { ActionFunctionArgs, data, LoaderFunctionArgs } from '@remix-run/node';
import { Link, useLoaderData, useNavigate } from '@remix-run/react';
import Defer from '~/components/Defer';
import {
  bulkDeleteEmployees,
  exportEmployees,
  getEmployees,
} from '~/services/employee.server';
import EmployeeList from './_components/EmployeeList';
import ContentHeader from '../../../../components/ContentHeader';
import { parseAuthCookie } from '~/services/cookie.server';
import { IEmployee } from '~/interfaces/employee.interface';
import { IListResponse } from '~/interfaces/response.interface';
import { useState } from 'react';
import EmployeeToolbar from './_components/EmployeeToolbar';
import { IListColumn } from '~/interfaces/app.interface';
import { Card, CardContent } from '~/components/ui/card';
import StatCard from '~/components/StatCard';
import EmployeeBulkActionBar from './_components/EmployeeBulkActionBar';
import EmployeeConfirmModal from './_components/EmployeeConfirmModal';
import { isAuthenticated } from '~/services/auth.server';

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
    employeesPromise: getEmployees({ ...query }, options, user!).catch((e) => {
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

  const [selectedEmployees, setSelectedEmployees] = useState<IEmployee[]>([]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<
    IListColumn<IEmployee>[]
  >([
    {
      key: 'employeeName',
      title: 'Tên nhân sự',
      sortField: 'emp_user.usr_firstName',
      visible: true,
      render: (employee: IEmployee) => (
        <Link
          to={`/erp/employees/${employee.id}`}
          className='text-blue-600 hover:underline'
        >
          {employee.emp_user.usr_firstName} {employee.emp_user.usr_lastName}
        </Link>
      ),
    },
    {
      key: 'employeeCode',
      title: 'Mã nhân sự',
      sortField: 'emp_code',
      visible: true,
      render: (employee: IEmployee) => (
        <span className='text-gray-600'>
          {employee.emp_code || 'Chưa có mã'}
        </span>
      ),
    },
    {
      key: 'department',
      title: 'Phòng ban',
      sortField: 'emp_department',
      visible: true,
      render: (employee: IEmployee) => (
        <span className='text-gray-600'>
          {employee.emp_department || 'Chưa có phòng ban'}
        </span>
      ),
    },
    {
      key: 'position',
      title: 'Chức vụ',
      sortField: 'emp_position',
      visible: true,
      render: (employee: IEmployee) => (
        <span className='text-gray-600'>
          {employee.emp_position || 'Chưa có chức vụ'}
        </span>
      ),
    },
    {
      key: 'msisdn',
      title: 'Số điện thoại',
      sortField: 'emp_user.usr_msisdn',
      visible: true,
      render: (employee: IEmployee) => (
        <span className='text-gray-600'>
          {employee.emp_user.usr_msisdn || 'Chưa có số điện thoại'}
        </span>
      ),
    },
  ]);

  const navigate = useNavigate();

  return (
    <>
      {/* Content Header */}
      <ContentHeader
        title='Trang chủ'
        actionContent={
          <>
            <span className='material-symbols-outlined text-sm mr-1'>add</span>
            Thêm nhân sự
          </>
        }
        actionHandler={() => navigate('/erp/employees/new')}
      />

      {/* Employee Stats */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
        <Defer resolve={employeesPromise}>
          {({ data }) => (
            <>
              <StatCard
                title='Tổng nhân sự'
                value={data.length}
                icon='people'
                color='green'
              />

              <StatCard
                title='Phòng ban'
                value={
                  data.reduce((prev, curr) => {
                    if (prev.includes(curr.emp_department)) return prev;
                    return [...prev, curr.emp_department];
                  }, [] as string[]).length
                }
                icon='category'
                color='purple'
              />

              <StatCard
                title='Sinh nhật tháng này'
                value={
                  data.filter(
                    (emp) =>
                      emp.emp_user.usr_birthdate &&
                      new Date(emp.emp_user.usr_birthdate).getMonth() ===
                        new Date().getMonth(),
                  ).length
                }
                icon='cake'
                color='blue'
              />
            </>
          )}
        </Defer>
      </div>

      <Card>
        {/* Employee Toolbar */}
        <EmployeeToolbar
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
        />

        {/* Bulk Action Bar (Visible when rows selected) */}
        {selectedEmployees.length > 0 && (
          <EmployeeBulkActionBar
            selectedEmployees={selectedEmployees}
            handleConfirmBulkDelete={() => setShowDeleteModal(true)}
          />
        )}

        {showDeleteModal && selectedEmployees.length && (
          <EmployeeConfirmModal
            setShowDeleteModal={setShowDeleteModal}
            selectedEmployees={selectedEmployees}
            setSelectedEmployees={setSelectedEmployees}
          />
        )}

        {/* Employee List */}
        <EmployeeList
          employeesPromise={employeesPromise}
          selectedEmployees={selectedEmployees}
          setSelectedEmployees={setSelectedEmployees}
          visibleColumns={visibleColumns}
        />
      </Card>
    </>
  );
}

// Action function để xử lý xóa chủ spa
export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, headers } = await isAuthenticated(request);

  if (!session) {
    return data({ success: false, message: 'Unauthorized' }, { headers });
  }

  const formData = await request.formData();

  try {
    switch (request.method) {
      case 'DELETE':
        const employeeIdsString = formData.get('employeeIds') as string;
        if (!employeeIdsString) {
          return data(
            { success: false, message: 'Dữ liệu không hợp lệ.' },
            { headers },
          );
        }

        const employeeIds = JSON.parse(employeeIdsString);
        if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
          return data(
            { success: false, message: 'Dữ liệu không hợp lệ.' },
            { headers },
          );
        }
        // Call the bulk delete function
        await bulkDeleteEmployees(employeeIds, session);

        return data(
          {
            success: true,
            message: `Đã xóa ${employeeIds.length} thành công`,
          },
          { headers },
        );

      case 'POST':
        // Handle export action
        const fileType = formData.get('fileType') as string;
        if (!fileType || !['xlsx'].includes(fileType)) {
          return data(
            { success: false, message: 'Định dạng file không hợp lệ.' },
            { headers },
          );
        }

        const url = new URL(request.url);
        const fileData = await exportEmployees(
          {
            search: url.searchParams.get('search') || '',
          },
          {
            sortBy: url.searchParams.get('sortBy') || 'createdAt',
            sortOrder:
              (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
          },
          fileType as 'xlsx',
          session,
        );
        return data(
          {
            success: true,
            message: `Đã xuất dữ liệu Nhân sự thành công!`,
            fileUrl: fileData.fileUrl,
            fileName: fileData.fileName,
            count: fileData.count,
          },
          { headers },
        );

      default:
        return data(
          { success: false, message: 'Method not allowed' },
          { headers },
        );
    }
  } catch (error: any) {
    console.error('Action error:', error);
    return data(
      {
        success: false,
        message: error.message || 'Có lỗi xảy ra khi thực hiện hành động',
      },
      { headers },
    );
  }
};
