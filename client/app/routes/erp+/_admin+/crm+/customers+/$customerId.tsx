import { deleteCustomer, getCustomerById } from '~/services/customer.server';
import { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { authenticator, isAuthenticated } from '~/services/auth.server';
import { data, useLoaderData, useNavigate } from '@remix-run/react';
import { parseAuthCookie } from '~/services/cookie.server';
import ContentHeader from '~/components/ContentHeader';
import Defer from '~/components/Defer';
import CustomerProfileHeader from './_components/CustomerProfileHeader';
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '~/components/ui/card';
import TextRenderer from '~/components/TextRenderer';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await parseAuthCookie(request);
  // Fetch customer details from the API
  const customerId = params.customerId as string;
  const customer = getCustomerById(customerId, user!).catch((err) => {
    console.error('Error fetching customer:', err);
    return { success: false, message: 'Không tìm thấy khách hàng' };
  });

  return { customerId, customer };
};
export default function CustomerDetails() {
  const { customerId, customer } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <div className='w-full space-y-8'>
      <ContentHeader
        title='Chi tiết khách hàng'
        actionContent={
          <>
            <span className='material-symbols-outlined text-sm mr-1'>edit</span>
            Sửa thông tin
          </>
        }
        actionHandler={() => navigate(`/erp/crm/customers/${customerId}/edit`)}
      />

      <Defer resolve={customer}>
        {(customer) => {
          return (
            <div className='flex flex-col gap-6'>
              <CustomerProfileHeader customer={customer} />

              <Card>
                <CardContent className='p-6'>
                  <CardTitle>Ghi chú</CardTitle>
                  <CardDescription>
                    <TextRenderer
                      content={
                        customer.cus_notes ||
                        'Chưa có ghi chú nào cho khách hàng này'
                      }
                    />
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className=''>
                <CardContent className='p-6'>
                  {/* Recent Attendance Log */}
                  {/* <Defer resolve={last7DaysStats}>
            {(data) =>
              data ? <AdminAttendanceLog attendanceStats={data} /> : null
            }
          </Defer> */}
                  customer case services list
                </CardContent>
              </Card>
            </div>
          );
        }}
      </Defer>
    </div>
  );
}
