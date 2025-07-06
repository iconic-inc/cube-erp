import { getCustomerById } from '~/services/customer.server';
import { getCaseServices } from '~/services/case.server';
import { getTransactions } from '~/services/transaction.server';
import { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { parseAuthCookie } from '~/services/cookie.server';
import ContentHeader from '~/components/ContentHeader';
import CustomerDetail from './_components/CustomerDetail';
import CustomerCaseServiceList from './_components/CustomerCaseServiceList';
import CustomerTransactionList from './_components/CustomerTransactionList';
import { Pen } from 'lucide-react';
import { canAccessCustomerManagement } from '~/utils/permission';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const session = await parseAuthCookie(request);

  if (!canAccessCustomerManagement(session?.user.usr_role)) {
    throw new Response('Bạn không có quyền truy cập vào trang này.', {
      status: 403,
    });
  }

  // Fetch customer data based on customer ID
  const customerId = params.customerId;
  if (!customerId) {
    throw new Response('Customer ID is required', { status: 400 });
  }
  const customerPromise = getCustomerById(customerId, session!).catch(
    (error) => {
      console.error('Error fetching customer:', error);
      return {
        success: false,
        message: error.message || 'Có lỗi khi lấy thông tin khách hàng',
      };
    },
  );
  const customerCaseServicesPromise = getCaseServices(
    { customerId },
    { page: 1, limit: 100 },
    session!,
  ).catch((error) => {
    console.error('Error fetching customer case services:', error);
    return {
      success: false,
      message: error.message || 'Có lỗi khi lấy danh sách hồ sơ dịch vụ',
    };
  });
  const customerTransactionsPromise = getTransactions(
    { customerId },
    { page: 1, limit: 100 },
    session!,
  ).catch((error) => {
    console.error('Error fetching customer transactions:', error);
    return {
      success: false,
      message: error.message || 'Có lỗi khi lấy danh sách giao dịch',
    };
  });

  return {
    customerId,
    customerPromise,
    customerCaseServicesPromise,
    customerTransactionsPromise,
  };
};
export default function CustomerDetails() {
  const {
    customerId,
    customerPromise,
    customerCaseServicesPromise,
    customerTransactionsPromise,
  } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <div className='space-y-4 md:space-y-6 min-h-screen'>
      <ContentHeader
        title='Chi tiết Khách hàng'
        actionContent={
          <>
            <Pen className='w-4 h-4 mr-1' />
            Chỉnh sửa Khách hàng
          </>
        }
        actionHandler={() => {
          navigate(`./edit`);
        }}
      />

      {/* Customer Details Card */}
      <CustomerDetail customerPromise={customerPromise} />

      {/* Associated Case Services Card */}
      <CustomerCaseServiceList
        customerId={customerId}
        customerCaseServicesPromise={customerCaseServicesPromise}
      />

      {/* Associated Transactions Card */}
      <CustomerTransactionList
        customerId={customerId}
        customerTransactionsPromise={customerTransactionsPromise}
      />
    </div>
  );
}
