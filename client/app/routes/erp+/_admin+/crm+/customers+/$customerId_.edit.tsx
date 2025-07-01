import { useLoaderData, data as dataResponse, Link } from '@remix-run/react';
import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { isAuthenticated } from '~/services/auth.server';
import { getCustomerById, updateCustomer } from '~/services/customer.server';
import CustomerDetailForm from './_components/CustomerDetailForm';
import { parseAuthCookie } from '~/services/cookie.server';
import { ICustomerCreate } from '~/interfaces/customer.interface';
import ContentHeader from '~/components/ContentHeader';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '~/components/ui/button';
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
    <div className=''>
      {/* Content Header */}
      <ContentHeader
        title='Chỉnh sửa khách hàng'
        backHandler={() => window.history.back()}
        actionContent={
          <div className='flex space-x-3'>
            <Link
              to={`/erp/crm/customers/${customerId}`}
              className='inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            >
              <ArrowLeft className='h-4 w-4 mr-2' />
              Quay lại
            </Link>
            <Button
              type='submit'
              form={formId}
              className='inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            >
              <Save className='h-4 w-4 mr-2' />
              Lưu thay đổi
            </Button>
          </div>
        }
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
