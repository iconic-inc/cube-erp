import { ActionFunctionArgs, data, LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useNavigate, Link } from '@remix-run/react';
import { useState } from 'react';
import { Plus } from 'lucide-react';

import {
  bulkDeleteTransactions,
  exportTransactionsToXLSX,
  getTransactions,
} from '~/services/transaction.server';
import ContentHeader from '~/components/ContentHeader';
import { parseAuthCookie } from '~/services/cookie.server';
import { ITransaction } from '~/interfaces/transaction.interface';
import {
  IActionFunctionReturn,
  IExportResponse,
  IListColumn,
} from '~/interfaces/app.interface';
import { isAuthenticated } from '~/services/auth.server';
import List from '~/components/List';
import { formatDate, formatCurrency } from '~/utils';
import { TRANSACTION } from '~/constants/transaction.constant';
import { Badge } from '~/components/ui/badge';
import { canAccessTransactionManagement } from '~/utils/permission';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await parseAuthCookie(request);

  if (!canAccessTransactionManagement(user?.user.usr_role)) {
    throw new Response('Bạn không có quyền truy cập vào trang này.', {
      status: 403,
    });
  }

  const url = new URL(request.url);

  return {
    transactionsPromise: getTransactions(url.searchParams, user!).catch(
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
      key: 'tx_title',
      title: 'Tiêu đề',
      visible: true,
      sortField: 'tx_title',
      render: (transaction) => (
        <Link
          to={`/erp/transactions/${transaction.id}`}
          className='text-blue-600 hover:underline py-2'
        >
          {transaction.tx_title || 'Không có tiêu đề'}
          <br />
          <span className='text-sm text-gray-500'>{transaction.tx_code}</span>
        </Link>
      ),
    },
    {
      key: 'tx_type',
      title: 'Loại giao dịch',
      visible: true,
      sortField: 'tx_type',
      filterField: 'type',
      options: Object.values(TRANSACTION.TYPE).map((type) => ({
        value: type.value,
        label: type.label,
      })),
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
      key: 'tx_customer',
      title: 'Khách hàng',
      visible: true,
      sortField: 'tx_customer.cus_firstName',
      render: (transaction) => {
        if (!transaction.tx_customer) return 'N/A';
        return (
          <Link
            to={`/erp/customers/${transaction.tx_customer.id}`}
            className='text-blue-600 hover:underline'
          >
            {transaction.tx_customer.cus_firstName}{' '}
            {transaction.tx_customer.cus_lastName}
          </Link>
        );
      },
    },
    {
      key: 'tx_createdBy',
      title: 'Người tạo',
      visible: true,
      sortField: 'tx_createdBy.emp_user.usr_firstName',
      render: (transaction) =>
        transaction.tx_createdBy?.emp_user ? (
          <Link
            to={`/erp/hr/employees/${transaction.tx_createdBy.id}`}
            className='text-blue-600 hover:underline'
          >
            {transaction.tx_createdBy.emp_user.usr_firstName}{' '}
            {transaction.tx_createdBy.emp_user.usr_lastName}
          </Link>
        ) : (
          'N/A'
        ),
    },
    {
      key: 'date',
      title: 'Ngày giao dịch',
      visible: true,
      sortField: 'tx_date',
      render: (transaction) =>
        formatDate(transaction.tx_date, 'HH:mm - DD/MM/YYYY'),
    },
  ]);

  const navigate = useNavigate();

  return (
    <div className='space-y-4 md:space-y-6 min-h-screen'>
      {/* Content Header */}
      <ContentHeader
        title='Danh sách giao dịch'
        actionContent={
          <>
            <Plus className='w-4 h-4' />
            Thêm giao dịch
          </>
        }
        actionHandler={() => navigate('/erp/transactions/new')}
      />

      <List<ITransaction>
        itemsPromise={transactionsPromise}
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns}
        exportable
        addNewHandler={() => navigate('/erp/transactions/new')}
        name='Giao dịch'
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
        const fileData = await exportTransactionsToXLSX(
          url.searchParams,
          session,
        );

        return data(
          {
            success: true,
            toast: {
              type: 'success',
              message: 'Đã xuất dữ liệu Nhân viên thành công!',
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
