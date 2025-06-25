import { ActionFunctionArgs, data, LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useNavigate, Link } from '@remix-run/react';
import { useState } from 'react';

import { bulkDeleteCaseService, getCaseServices } from '~/services/case.server';
import ContentHeader from '~/components/ContentHeader';
import { parseAuthCookie } from '~/services/cookie.server';
import { ICaseService } from '~/interfaces/case.interface';
import { IListResponse } from '~/interfaces/response.interface';
import { IListColumn } from '~/interfaces/app.interface';
import { isAuthenticated } from '~/services/auth.server';
import List from '~/components/List';
import {
  CASE_SERVICE,
  CASE_STATUS_BADGE_CLASSES,
} from '~/constants/caseService.constant';

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
    casesPromise: getCaseServices({ ...query }, options, user!).catch((e) => {
      console.error(e);
      return {
        data: [],
        pagination: {
          totalPages: 0,
          page: 1,
          limit: 10,
          total: 0,
        },
      } as IListResponse<ICaseService>;
    }),
  };
};

export default function CRMCaseService() {
  const { casesPromise } = useLoaderData<typeof loader>();

  const [visibleColumns, setVisibleColumns] = useState<
    IListColumn<ICaseService>[]
  >([
    {
      title: 'Mã Hồ sơ',
      key: 'code',
      visible: true,
      sortField: 'tsk_code',
      render: (item) => (
        <Link
          to={`/erp/crm/cases/${item.id}`}
          className='text-blue-600 hover:underline block w-full h-full'
        >
          {item.case_code}
        </Link>
      ),
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      visible: true,
      sortField: 'tsk_customer.cus_firstName',
      render: (item) => (
        <Link
          to={`/erp/crm/customers/${item.case_customer.id}`}
          className='text-blue-600 hover:underline block w-full h-full truncate'
        >
          {item.case_customer.cus_firstName} {item.case_customer.cus_lastName}
        </Link>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      visible: true,
      sortField: 'tsk_status',
      render: (item) => (
        <span className={`${CASE_STATUS_BADGE_CLASSES[item.case_status]}`}>
          {CASE_SERVICE.STATUS[item.case_status] || '-'}
        </span>
      ),
    },
    {
      title: 'Luật sư chính',
      key: 'leadAttorney',
      visible: true,
      sortField: 'tsk_leadAttorney.emp_fullName',
      render: (item) => (
        <Link
          to={`/erp/hr/employees/${item.case_leadAttorney.id}`}
          className='text-blue-600 hover:underline block w-full h-full'
        >
          {item.case_leadAttorney.emp_user.usr_firstName}{' '}
          {item.case_leadAttorney.emp_user.usr_lastName}
        </Link>
      ),
    },
    {
      title: 'Ngày bắt đầu',
      key: 'startDate',
      visible: true,
      sortField: 'tsk_startDate',
      render: (item) => new Date(item.case_startDate).toLocaleDateString(),
    },
    {
      title: 'Ngày kết thúc',
      key: 'endDate',
      visible: true,
      sortField: 'tsk_endDate',
      render: (item) =>
        item.case_endDate
          ? new Date(item.case_endDate).toLocaleDateString()
          : '-',
    },
  ]);

  const navigate = useNavigate();

  return (
    <>
      {/* Content Header */}
      <ContentHeader
        title='Danh sách Hồ sơ vụ việc'
        actionContent={
          <>
            <span className='material-symbols-outlined text-sm mr-1'>add</span>
            Thêm Hồ sơ vụ việc
          </>
        }
        actionHandler={() => navigate('/erp/crm/cases/new')}
      />

      {/* Case Stats */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'></div>

      <List<ICaseService>
        itemsPromise={casesPromise}
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns}
        addNewHandler={() => navigate('/erp/crm/cases/new')}
        name='Hồ sơ vụ việc'
      />
    </>
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
              message: `Đã xóa ${caseIds.length} Hồ sơ vụ việc thành công`,
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
