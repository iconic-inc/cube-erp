import { ActionFunctionArgs, data, LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useNavigate, Link } from '@remix-run/react';
import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';

import {
  bulkDeleteCaseService,
  exportCaseServicesToXLSX,
  getMyCaseServices,
} from '~/services/case.server';
import ContentHeader from '~/components/ContentHeader';
import { parseAuthCookie } from '~/services/cookie.server';
import { ICaseService } from '~/interfaces/case.interface';
import {
  IListColumn,
  IActionFunctionReturn,
  IExportResponse,
} from '~/interfaces/app.interface';
import { isAuthenticated } from '~/services/auth.server';
import List from '~/components/List';
import {
  CASE_SERVICE,
  CASE_STATUS_BADGE_CLASSES,
} from '~/constants/caseService.constant';
import { canAccessCaseServices } from '~/utils/permission';
import { getEmployees } from '~/services/employee.server';
import { getCustomers } from '~/services/customer.server';
import { isResolveError } from '~/lib';
import { IEmployeeBrief } from '~/interfaces/employee.interface';
import { ICustomerBrief } from '~/interfaces/customer.interface';
import { formatDate } from '~/utils';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await parseAuthCookie(request);
  if (!canAccessCaseServices(user?.user.usr_role)) {
    throw new Response('Bạn không có quyền truy cập vào trang này.', {
      status: 403,
    });
  }

  const url = new URL(request.url);

  return {
    casesPromise: getMyCaseServices(url.searchParams, user!).catch((e) => {
      console.error(e);
      return {
        success: false,
        message: 'Không thể tải danh sách Hồ sơ vụ việc',
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
    customersPromise: getCustomers(
      new URLSearchParams([['limit', '1000']]),
      user!,
    ).catch((e) => {
      console.error(e);
      return {
        success: false,
        message: e.message || 'Có lỗi xảy ra khi lấy danh sách khách hàng',
      };
    }),
  };
};

export default function CRMCaseService() {
  const { casesPromise, employeesPromise, customersPromise } =
    useLoaderData<typeof loader>();

  useEffect(() => {
    const loadFilterData = async () => {
      // Load employees for lead attorney filter
      const employeesData = (await employeesPromise) as any;
      const customersData = (await customersPromise) as any;

      setVisibleColumns((prevColumns) =>
        prevColumns.map((col) => {
          if (col.key === 'leadAttorney' && !isResolveError(employeesData)) {
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
          if (col.key === 'customer' && !isResolveError(customersData)) {
            return {
              ...col,
              options: customersData.data.length
                ? customersData.data.map((customer: ICustomerBrief) => ({
                    value: customer.id,
                    label: `${customer.cus_firstName} ${customer.cus_lastName}`,
                  }))
                : [
                    {
                      value: '',
                      label: 'Không có khách hàng',
                    },
                  ],
            };
          }
          return col;
        }),
      );
    };
    loadFilterData();
  }, [employeesPromise, customersPromise]);

  const [visibleColumns, setVisibleColumns] = useState<
    IListColumn<ICaseService>[]
  >([
    {
      title: 'Mã Hồ sơ',
      key: 'code',
      visible: true,
      sortField: 'case_code',
      render: (item) => (
        <Link
          to={`/erp/cases/${item.id}`}
          className='text-blue-600 hover:underline block w-full h-full'
        >
          <div className='flex flex-col'>
            <span className='font-medium text-sm sm:text-base truncate'>
              {item.case_code}
            </span>
          </div>
        </Link>
      ),
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      visible: true,
      sortField: 'case_customer.cus_firstName',
      filterField: 'customerId',
      options: [],
      render: (item) => (
        <Link
          to={`/erp/customers/${item.case_customer.id}`}
          className='text-blue-600 hover:underline block w-full h-full'
        >
          <span className='text-sm sm:text-base truncate block max-w-[150px] sm:max-w-none'>
            {item.case_customer.cus_firstName} {item.case_customer.cus_lastName}
          </span>
        </Link>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      visible: true,
      sortField: 'case_status',
      filterField: 'status',
      options: Object.keys(CASE_SERVICE.STATUS).map((key) => ({
        value: key,
        label: CASE_SERVICE.STATUS[key as keyof typeof CASE_SERVICE.STATUS],
      })),
      render: (item) => (
        <span
          className={`${CASE_STATUS_BADGE_CLASSES[item.case_status]} text-xs sm:text-sm whitespace-nowrap`}
        >
          {CASE_SERVICE.STATUS[item.case_status] || '-'}
        </span>
      ),
    },
    {
      title: 'Luật sư chính',
      key: 'leadAttorney',
      visible: true,
      sortField: 'case_leadAttorney.emp_user.usr_firstName',
      filterField: 'leadAttorneyId',
      options: [],
      render: (item) =>
        item.case_leadAttorney ? (
          <Link
            to={`/erp/hr/employees/${item.case_leadAttorney.id}`}
            className='text-blue-600 hover:underline block w-full h-full'
          >
            <span className='text-sm sm:text-base truncate block max-w-[120px] sm:max-w-none'>
              {item.case_leadAttorney.emp_user.usr_firstName}{' '}
              {item.case_leadAttorney.emp_user.usr_lastName}
            </span>
          </Link>
        ) : (
          <span className='text-gray-500 text-sm sm:text-base'>N/A</span>
        ),
    },
    {
      title: 'Ngày bắt đầu',
      key: 'startDate',
      visible: true,
      sortField: 'case_startDate',
      filterField: 'startDate',
      dateFilterable: true,
      render: (item) => (
        <span className='text-gray-600 text-xs sm:text-sm truncate block max-w-[100px] sm:max-w-none'>
          {formatDate(item.case_startDate, 'DD/MM/YYYY')}
        </span>
      ),
    },
    {
      title: 'Ngày kết thúc',
      key: 'endDate',
      visible: true,
      sortField: 'case_endDate',
      filterField: 'endDate',
      dateFilterable: true,
      render: (item) => (
        <span className='text-gray-600 text-xs sm:text-sm truncate block max-w-[100px] sm:max-w-none'>
          {item.case_endDate
            ? formatDate(item.case_endDate, 'DD/MM/YYYY')
            : '-'}
        </span>
      ),
    },
  ]);

  const navigate = useNavigate();

  return (
    <div className='space-y-4 sm:space-y-6 min-h-screen'>
      {/* Content Header */}
      <ContentHeader
        title='Danh sách Hồ sơ vụ việc'
        actionContent={
          <>
            <Plus className='w-4 h-4' />
            <span className='hidden sm:inline'>Thêm Hồ sơ vụ việc</span>
            <span className='sm:hidden'>Thêm</span>
          </>
        }
        actionHandler={() => navigate('/erp/cases/new')}
      />

      <List<ICaseService>
        itemsPromise={casesPromise}
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns}
        addNewHandler={() => navigate('/erp/cases/new')}
        exportable
        name='Hồ sơ vụ việc'
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
        const caseIdsString = formData.get('itemIds') as string;
        if (!caseIdsString) {
          return data(
            {
              success: false,
              toast: {
                message: 'Không có Hồ sơ vụ việc nào được chọn để xóa',
                type: 'error',
              },
            },
            { headers },
          );
        }

        const caseIds = JSON.parse(caseIdsString);
        if (!Array.isArray(caseIds) || caseIds.length === 0) {
          return data(
            {
              success: false,
              toast: {
                message: 'Không có Hồ sơ vụ việc nào được chọn để xóa',
                type: 'error',
              },
            },
            { headers },
          );
        }
        // Call the bulk delete function
        await bulkDeleteCaseService(caseIds, session);

        return data(
          {
            success: true,
            toast: {
              type: 'success',
              message: `Đã xóa ${caseIds.length} Hồ sơ vụ việc thành công`,
            },
          },
          { headers },
        );

      case 'POST':
        // Handle export action (placeholder for future implementation)
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

        // TODO: Implement export functionality when exportCaseServices is available
        const url = new URL(request.url);
        const fileData = await exportCaseServicesToXLSX(
          url.searchParams,
          session,
        );

        return data(
          {
            success: true,
            toast: {
              type: 'success',
              message: 'Đã xuất dữ liệu Hồ sơ vụ việc thành công!',
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
