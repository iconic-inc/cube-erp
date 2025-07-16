import { LoaderFunctionArgs } from '@remix-run/node';

import { getTransactionById } from '~/services/transaction.server';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { parseAuthCookie } from '~/services/cookie.server';
import ContentHeader from '~/components/ContentHeader';
import TransactionDetail from './_components/TransactionDetail';
import { Edit, Pencil } from 'lucide-react';
import { canAccessTransactionManagement } from '~/utils/permission';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await parseAuthCookie(request);

  if (!canAccessTransactionManagement(user?.user.usr_role)) {
    throw new Response('Bạn không có quyền truy cập vào trang này.', {
      status: 403,
    });
  }

  // Fetch transaction details from the API
  const transactionId = params.transactionId as string;
  const transaction = getTransactionById(transactionId, user!).catch(
    (error) => {
      console.error('Error fetching transaction:', error.message);
      return {
        success: false,
        message:
          (error.message as string) ||
          'Có lỗi xảy ra khi lấy thông tin giao dịch',
      };
    },
  );

  return { transaction };
};

export default function TransactionDetailPage() {
  const { transaction } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <div className='space-y-4 md:space-y-6 min-h-screen'>
      <ContentHeader
        title='Chi tiết Giao dịch'
        actionContent={
          <>
            <Edit />
            <span className='hidden md:inline'>Sửa Giao dịch</span>
            <span className='inline md:hidden'>Sửa</span>
          </>
        }
        actionHandler={() => {
          // Navigate to the edit page
          navigate(`./edit`);
        }}
        backHandler={() => navigate('/erp/transactions')}
      />

      <TransactionDetail transactionPromise={transaction} />
    </div>
  );
}
