import { ActionFunctionArgs, data, LoaderFunctionArgs } from '@remix-run/node';
import { Link, useLoaderData, useNavigate } from '@remix-run/react';
import Defer from '~/components/Defer';
import {
  deleteMultipleCustomers,
  getCustomers,
} from '~/services/customer.server';
import CustomerList from './_components/CustomerList';
import ContentHeader from '~/components/ContentHeader';
import { parseAuthCookie } from '~/services/cookie.server';
import { ICustomer } from '~/interfaces/customer.interface';
import { IListResponse } from '~/interfaces/response.interface';
import { useState } from 'react';
import CustomerToolbar from './_components/CustomerToolbar';
import { IListColumn } from '~/interfaces/app.interface';
import { Card } from '~/components/ui/card';
import StatCard from '~/components/StatCard';
import CustomerBulkActionBar from './_components/CustomerBulkActionBar';
import CustomerConfirmModal from './_components/CustomerConfirmModal';
import { isAuthenticated } from '~/services/auth.server';
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

  const [selectedCustomers, setSelectedCustomers] = useState<ICustomer[]>([]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
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
            {customer.cus_birthDate
              ? formatDate(customer.cus_birthDate)
              : 'Chưa có ngày sinh'}
          </span>
        </Link>
      ),
    },
    {
      key: 'code',
      title: 'Mã Khách hàng',
      sortField: 'cus_code',
      visible: true,
      render: (customer: ICustomer) => customer.cus_code || 'Chưa có mã',
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
            Thêm Khách hàng
          </>
        }
        actionHandler={() => navigate('/erp/crm/customers/new')}
      />

      {/* Customer Stats */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
        <Defer resolve={customersPromise}>
          {({ data }) => (
            <>
              <StatCard
                title='Tổng Khách hàng'
                value={data.length}
                icon='people'
                color='green'
              />

              <StatCard
                title='Sinh nhật tháng này'
                value={
                  data.filter(
                    (cus) =>
                      cus.cus_birthDate &&
                      new Date(cus.cus_birthDate).getMonth() ===
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
        {/* Customer Toolbar */}
        <CustomerToolbar
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
        />

        {/* Bulk Action Bar (Visible when rows selected) */}
        {selectedCustomers.length > 0 && (
          <CustomerBulkActionBar
            selectedCustomers={selectedCustomers}
            handleConfirmBulkDelete={() => setShowDeleteModal(true)}
          />
        )}

        {showDeleteModal && selectedCustomers.length && (
          <CustomerConfirmModal
            setShowDeleteModal={setShowDeleteModal}
            selectedCustomers={selectedCustomers}
            setSelectedCustomers={setSelectedCustomers}
          />
        )}

        {/* Customer List */}
        <CustomerList
          customersPromise={customersPromise}
          selectedCustomers={selectedCustomers}
          setSelectedCustomers={setSelectedCustomers}
          visibleColumns={visibleColumns}
        />
      </Card>
    </>
  );
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, headers } = await isAuthenticated(request);

  if (!session) {
    return data({ success: false, message: 'Unauthorized' }, { headers });
  }

  const formData = await request.formData();

  try {
    switch (request.method) {
      case 'DELETE':
        const customerIdsString = formData.get('customerIds') as string;
        if (!customerIdsString) {
          return data(
            { success: false, message: 'Dữ liệu không hợp lệ.' },
            { headers },
          );
        }

        const customerIds = JSON.parse(customerIdsString);
        if (!Array.isArray(customerIds) || customerIds.length === 0) {
          return data(
            { success: false, message: 'Dữ liệu không hợp lệ.' },
            { headers },
          );
        }
        // Call the bulk delete function
        await deleteMultipleCustomers(customerIds, session);

        return data(
          {
            success: true,
            message: `Đã xóa ${customerIds.length} thành công`,
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

      // const url = new URL(request.url);
      // const fileData = await exportCustomer(
      //   {
      //     search: url.searchParams.get('search') || '',
      //   },
      //   {
      //     sortBy: url.searchParams.get('sortBy') || 'createdAt',
      //     sortOrder:
      //       (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      //   },
      //   fileType as 'xlsx',
      //   session,
      // );
      // return data(
      //   {
      //     success: true,
      //     message: `Đã xuất dữ liệu Khách hàng thành công!`,
      //     fileUrl: fileData.fileUrl,
      //     fileName: fileData.fileName,
      //     count: fileData.count,
      //   },
      //   { headers },
      // );

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
