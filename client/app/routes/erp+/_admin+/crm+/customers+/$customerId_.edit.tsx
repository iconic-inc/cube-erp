import {
  useLoaderData,
  useNavigate,
  data as dataResponse,
  Link,
} from '@remix-run/react';
import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { isAuthenticated } from '~/services/auth.server';
import { getCustomerById, updateCustomer } from '~/services/customer.server';
import CustomerDetailForm from './_components/CustomerDetailForm';
import { useState } from 'react';
import { parseAuthCookie } from '~/services/cookie.server';
import { ICustomerCreate } from '~/interfaces/customer.interface';
import { Button } from '~/components/ui/button';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const auth = await parseAuthCookie(request);
  const { customerId } = params;

  if (!customerId) {
    throw new Response('Không tìm thấy Khách hàng.', {
      status: 404,
    });
  }

  try {
    const customer = await getCustomerById(customerId, auth!);
    return dataResponse({
      customer,
    });
  } catch (error: any) {
    throw new Response(error.message || error.statusText, {
      status: error.status || 500,
    });
  }
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

export default function () {
  const { customer } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const [isChanged, setIsChanged] = useState(false);

  const formId = 'customer-profile-form';
  return (
    <>
      {/* Content Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
        <div className='flex items-center'>
          <h1 className='text-xl font-semibold'>Customer Profile</h1>
          <div className='ml-3 text-gray-500 text-sm flex items-center'>
            <a href='/erp' className='hover:text-blue-500 transition'>
              Dashboard
            </a>
            <span className='mx-2'>/</span>
            <span>Profile</span>
          </div>
        </div>
        <div className='flex space-x-2'>
          <button
            type='reset'
            disabled={!isChanged}
            onClick={() => {
              if (
                confirm(
                  'Bạn có chắc chắn muốn huỷ thay đổi không? Thay đổi sẽ không được lưu.',
                )
              ) {
                navigate(-1);
              }
            }}
            className='bg-white hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm flex items-center border border-gray-200 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <span className='material-symbols-outlined text-sm mr-1'>
              cancel
            </span>
            Huỷ
          </button>
          <button
            type='submit'
            disabled={!isChanged}
            form={formId}
            className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm flex items-center transition-all duration-300 shadow-sm hover:shadow transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <span className='material-symbols-outlined text-sm mr-1'>save</span>
            Lưu thay đổi
          </button>
        </div>
      </div>

      {/* Profile Form */}
      <CustomerDetailForm
        formId={formId}
        customer={customer}
        setIsChanged={setIsChanged}
        type='update'
      />

      {/* Bottom Action Buttons */}
      <div className='flex justify-between items-center mt-6'>
        <Link
          to='/erp/crm/customers'
          className='bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm flex items-center transition-all duration-300'
        >
          <span className='material-symbols-outlined text-sm mr-1'>
            keyboard_return
          </span>
          Trở về Danh sách
        </Link>

        <div className='flex space-x-2'>
          <Button
            className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm flex items-center transition-all duration-300 shadow-sm hover:shadow transform hover:-translate-y-0.5'
            type='submit'
            form={formId}
            disabled={!isChanged}
          >
            <span className='material-symbols-outlined text-sm mr-1'>save</span>
            Lưu Thay đổi
          </Button>
        </div>
      </div>
    </>
  );
}
