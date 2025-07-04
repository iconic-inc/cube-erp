import { useLoaderData, data as dataResponse, Link } from '@remix-run/react';
import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { isAuthenticated } from '~/services/auth.server';
import { getCustomerById, updateCustomer } from '~/services/customer.server';
import CustomerDetailForm from './_components/CustomerDetailForm';
import { parseAuthCookie } from '~/services/cookie.server';
import { ICustomerCreate } from '~/interfaces/customer.interface';
import ContentHeader from '~/components/ContentHeader';
import { generateFormId } from '~/utils';
import { useMemo } from 'react';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const auth = await parseAuthCookie(request);
  const { customerId } = params;

  if (!customerId) {
    throw new Response('Không tìm thấy Khách hàng.', {
      status: 404,
    });
  }

  const customerPromise = getCustomerById(customerId, auth!).catch((error) => {
    console.error('Error fetching customer:', error);
    return {
      success: false,
      message: error.message || 'Có lỗi khi lấy thông tin khách hàng',
    };
  });

  return dataResponse({
    customerPromise,
    customerId,
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session, headers } = await isAuthenticated(request);

  switch (request.method) {
    case 'PUT':
      try {
        const { customerId } = params;
        if (!customerId) {
          return dataResponse(
            {
              customer: null,
              redirectTo: null,
              toast: {
                message: 'Không tìm thấy Khách hàng.',
                type: 'error',
              },
            },
            { headers },
          );
        }

        const formData = await request.formData();
        const data: ICustomerCreate = {
          firstName: formData.get('firstName') as string,
          lastName: formData.get('lastName') as string,
          email: formData.get('email') as string,
          msisdn: formData.get('msisdn') as string,
          address: formData.get('address') as string,
          sex: formData.get('sex') as string,
          birthDate: formData.get('birthDate') as string,
          code: formData.get('code') as string,
          notes: formData.get('notes') as string,
          contactChannel: formData.get('contactChannel') as string,
          source: formData.get('source') as string,
        };
        // Kiểm tra dữ liệu bắt buộc
        if (
          ['firstName', 'email', 'msisdn', 'code'].some(
            (field) => !data[field as keyof ICustomerCreate],
          )
        ) {
          return dataResponse(
            {
              customer: null,
              redirectTo: null,
              toast: {
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc',
                type: 'error',
              },
            },
            { headers },
          );
        }

        const updatedCustomer = await updateCustomer(
          customerId,
          data,
          session!,
        );
        return dataResponse(
          {
            customer: updatedCustomer,
            redirectTo: `/erp/crm/customers/${updatedCustomer.id}`,
            toast: {
              message: 'Cập nhật thông tin Khách hàng thành công!',
              type: 'success',
            },
          },
          { headers },
        );
      } catch (error: any) {
        return dataResponse(
          {
            customer: null,
            redirectTo: null,
            toast: { message: error.message || 'Update failed', type: 'error' },
          },
          { headers },
        );
      }

    default:
      return dataResponse(
        {
          customer: null,
          redirectTo: null,
          toast: { message: 'Method not allowed', type: 'error' },
        },
        {
          status: 405,
          statusText: 'Method Not Allowed',
          headers,
        },
      );
  }
};

export default function CustomerEditPage() {
  const { customerPromise, customerId } = useLoaderData<typeof loader>();

  const formId = useMemo(() => generateFormId('customer-edit-form'), []);

  return (
    <div className='space-y-4 md:space-y-6 min-h-screen'>
      {/* Content Header */}
      <ContentHeader
        title='Chỉnh sửa khách hàng'
        backHandler={() => window.history.back()}
      />

      {/* Customer Edit Form */}
      <div className='mt-8'>
        <CustomerDetailForm
          formId={formId}
          type='update'
          customerPromise={customerPromise}
          action={`/erp/crm/customers/${customerId}/edit`}
        />
      </div>
    </div>
  );
}
