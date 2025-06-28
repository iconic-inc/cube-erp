import { ActionFunctionArgs, data, LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useNavigate, Link } from '@remix-run/react';
import { useState } from 'react';

import {
  bulkDeleteTransactions,
  getTransactions,
} from '~/services/transaction.server';
import ContentHeader from '~/components/ContentHeader';
import { parseAuthCookie } from '~/services/cookie.server';
import { ITransaction } from '~/interfaces/transaction.interface';
import { IListResponse } from '~/interfaces/response.interface';
import { IListColumn } from '~/interfaces/app.interface';
import { isAuthenticated } from '~/services/auth.server';
import List from '~/components/List';
import { formatDate, formatCurrency } from '~/utils';
import { TRANSACTION } from '~/constants/transaction.constant';
import { Badge } from '~/components/ui/badge';

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
    transactionsPromise: getTransactions({ ...query }, options, user!).catch(
      (e: any) => {
        console.error(e);
        return {
          success: false,
          message: e.message || 'Có lỗi xảy ra khi lấy danh sách giao dịch',
        };
      },
    ),
  };
};

export default function () {
  const { transactionsPromise } = useLoaderData<typeof loader>();

  const [visibleColumns, setVisibleColumns] = useState<
    IListColumn<ITransaction>[]
  >([
    {
      key: 'tx_code',
      title: 'Mã giao dịch',
      visible: true,
      sortField: 'tx_code',
      render: (transaction) => (
        <Link
          to={`/erp/transactions/${transaction.id}`}
          className='text-blue-600 hover:underline py-2'
        >
          {transaction.tx_code}
        </Link>
      ),
    },
    {
      key: 'tx_title',
      title: 'Tiêu đề',
      visible: true,
      sortField: 'tx_title',
      render: (transaction) => transaction.tx_title,
    },
    {
      key: 'tx_type',
      title: 'Loại giao dịch',
      visible: true,
      sortField: 'tx_type',
      render: (transaction) => (
        <Badge
          className={`${
            TRANSACTION.TYPE[transaction.tx_type]?.className ||
            'bg-gray-200 text-gray-800'
          }`}
        >
          {TRANSACTION.TYPE[transaction.tx_type]?.label || transaction.tx_type}
        </Badge>
      ),
    },
    {
      key: 'tx_amount',
      title: 'Số tiền',
      visible: true,
      sortField: 'tx_amount',
      render: (transaction) => formatCurrency(transaction.tx_amount),
    },
    {
      key: 'remain',
      title: 'Còn lại',
      visible: true,
      sortField: 'tx_remain',
      render: (transaction) =>
        formatCurrency(transaction.tx_amount - transaction.tx_paid),
    },
    {
      key: 'tx_paymentMethod',
      title: 'Phương thức',
      visible: true,
      sortField: 'tx_paymentMethod',
      render: (transaction) => {
        const methodMap: Record<string, string> = {
          cash: 'Tiền mặt',
          bank_transfer: 'Chuyển khoản',
          credit_card: 'Thẻ tín dụng',
          mobile_payment: 'Thanh toán di động',
          other: 'Khác',
        };
        return (
          methodMap[transaction.tx_paymentMethod] ||
          transaction.tx_paymentMethod
        );
      },
    },
    {
      key: 'tx_customer',
      title: 'Khách hàng',
      visible: true,
      sortField: 'tx_customer.cus_firstName',
      render: (transaction) =>
        transaction.tx_customer ? (
          <Link
            to={`/erp/crm/customers/${transaction.tx_customer?.id}`}
            className='text-blue-600 hover:underline'
          >
            {`${transaction.tx_customer?.cus_firstName} ${transaction.tx_customer?.cus_lastName}`}
          </Link>
        ) : (
          '-'
        ),
    },
    {
      key: 'tx_caseService',
      title: 'Mã Hồ sơ',
      visible: true,
      sortField: 'tx_caseService.case_code',
      render: (transaction) =>
        transaction.tx_caseService ? (
          <Link
            to={`/erp/crm/cases/${transaction.tx_caseService?.id}`}
            className='text-blue-600 hover:underline'
          >
            {transaction.tx_caseService?.case_code}
          </Link>
        ) : (
          '-'
        ),
    },
    {
      key: 'createdAt',
      title: 'Ngày tạo',
      visible: true,
      sortField: 'createdAt',
      render: (transaction) => formatDate(transaction.createdAt),
    },
  ]);

  const navigate = useNavigate();

  return (
    <>
      {/* Content Header */}
      <ContentHeader
        title='Danh sách giao dịch'
        actionContent={
          <>
            <span className='material-symbols-outlined text-sm mr-1'>add</span>
            Thêm giao dịch
          </>
        }
        actionHandler={() => navigate('/erp/transactions/new')}
      />

      {/* Transaction Stats */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'></div>

      <List<ITransaction>
        itemsPromise={transactionsPromise}
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns}
        addNewHandler={() => navigate('/erp/transactions/new')}
        name='Giao dịch'
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
        const transactionIdsString = formData.get('itemIds') as string;
        if (!transactionIdsString) {
          return data(
            {
              success: false,
              toast: {
                message: 'Không có giao dịch nào được chọn để xóa',
                type: 'error',
              },
            },
            { headers },
          );
        }

        const transactionIds = JSON.parse(transactionIdsString);
        if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
          return data(
            {
              success: false,
              toast: {
                message: 'Không có giao dịch nào được chọn để xóa',
                type: 'error',
              },
            },
            { headers },
          );
        }
        // Call the bulk delete function
        await bulkDeleteTransactions(transactionIds, session);

        return data(
          {
            success: true,
            toast: {
              message: `Đã xóa ${transactionIds.length} giao dịch thành công`,
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
