import { ActionFunctionArgs, data, LoaderFunctionArgs } from '@remix-run/node';
import { Link, useLoaderData, useNavigate } from '@remix-run/react';
import {
  deleteMultipleCustomers,
  exportCustomers,
  getCustomers,
} from '~/services/customer.server';
import ContentHeader from '~/components/ContentHeader';
import { parseAuthCookie } from '~/services/cookie.server';
import { ICustomer } from '~/interfaces/customer.interface';
import { IListResponse } from '~/interfaces/response.interface';
import { useState } from 'react';
import {
  IListColumn,
  IActionFunctionReturn,
  IExportResponse,
} from '~/interfaces/app.interface';
import { isAuthenticated } from '~/services/auth.server';
import List from '~/components/List';
import { Button } from '~/components/ui/button';

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
    customersPromise: getCustomers({ ...query }, options, user!).catch((e) => {
      console.error(e);
      return {
        data: [],
        pagination: {
          totalPages: 0,
          page: 1,
          limit: 10,
          total: 0,
        },
      } as IListResponse<ICustomer>;
    }),
  };
};

export default function HRMCustomers() {
  const { customersPromise } = useLoaderData<typeof loader>();

  const [visibleColumns, setVisibleColumns] = useState<
    IListColumn<ICustomer>[]
  >([
    {
      key: 'customerName',
      title: 'Tên Khách hàng',
      sortField: 'cus_user.usr_firstName',
      visible: true,
      render: (customer: ICustomer) => (
        <Link
          to={`/erp/crm/customers/${customer.id}`}
          className='text-blue-600 hover:underline flex flex-col'
        >
          <span>
            {customer.cus_firstName} {customer.cus_lastName}
          </span>
          <span className='text-gray-500 text-sm truncate'>
            {customer.cus_code || 'Chưa có mã'}
          </span>
        </Link>
      ),
    },
    {
      key: 'msisdn',
      title: 'Số điện thoại',
      sortField: 'cus_msisdn',
      visible: true,
      render: (customer: ICustomer) =>
        customer.cus_msisdn ? (
          <Link
            to={`tel:${customer.cus_msisdn}`}
            className='text-blue-600 hover:underline truncate'
            onClick={(e) => e.stopPropagation()}
          >
            {customer.cus_msisdn}
          </Link>
        ) : (
          'Chưa có số điện thoại'
        ),
    },
    {
      key: 'email',
      title: 'Email',
      sortField: 'cus_email',
      visible: true,
      render: (customer: ICustomer) =>
        customer.cus_email ? (
          <Link
            to={`mailto:${customer.cus_email}`}
            className='text-blue-600 hover:underline truncate'
            onClick={(e) => e.stopPropagation()}
          >
            {customer.cus_email}
          </Link>
        ) : (
          'Chưa có email'
        ),
    },
    {
      key: 'address',
      title: 'Địa chỉ',
      sortField: 'cus_address',
      visible: true,
      render: (customer: ICustomer) =>
        customer.cus_address || 'Chưa có địa chỉ',
    },
    {
      key: 'action',
      title: 'Hành động',
      visible: true,
      render: (customer) => (
        <Button variant='primary' asChild>
          <Link to={`/erp/crm/cases/new?customerId=${customer?.id || ''}`}>
            Thêm Hồ sơ vụ việc
          </Link>
        </Button>
      ),
    },
  ]);

  const navigate = useNavigate();

  return (
    <div className='w-full space-y-8'>
      {/* Content Header */}
      <ContentHeader
        title='Danh sách Khách hàng'
        actionContent={
          <>
            <span className='material-symbols-outlined text-sm mr-1'>add</span>
            Thêm Khách hàng
          </>
        }
        actionHandler={() => navigate('/erp/crm/customers/new')}
      />

      <List<ICustomer>
        itemsPromise={customersPromise}
        name='Khách hàng'
        exportable
        setVisibleColumns={setVisibleColumns}
        visibleColumns={visibleColumns}
        addNewHandler={() => navigate('/erp/crm/customers/new')}
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
        const customerIdsString = formData.get('itemIds') as string;
        if (!customerIdsString) {
          return data(
            {
              success: false,
              toast: {
                message: 'Không có khách hàng nào được chọn để xóa',
                type: 'error',
              },
            },
            { headers },
          );
        }

        const customerIds = JSON.parse(customerIdsString);
        if (!Array.isArray(customerIds) || customerIds.length === 0) {
          return data(
            {
              success: false,
              toast: {
                message: 'Không có khách hàng nào được chọn để xóa',
                type: 'error',
              },
            },
            { headers },
          );
        }
        // Call the bulk delete function
        await deleteMultipleCustomers(customerIds, session);

        return data(
          {
            success: true,
            toast: {
              type: 'success',
              message: `Đã xóa ${customerIds.length} khách hàng thành công`,
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
        const fileData = await exportCustomers(
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
            toast: {
              type: 'success',
              message: `Đã xuất dữ liệu Khách hàng thành công!`,
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
