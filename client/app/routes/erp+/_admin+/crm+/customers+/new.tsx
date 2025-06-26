import { useState } from 'react';
import { Link, useLocation, data as dataResponse } from '@remix-run/react';

import { ActionFunctionArgs } from '@remix-run/node';
import { isAuthenticated } from '~/services/auth.server';
import { createCustomer } from '~/services/customer.server';
import { toast } from 'react-toastify';
import { ICustomerCreate } from '~/interfaces/customer.interface';
import CustomerDetailForm from './_components/CustomerDetailForm';
import { Button } from '~/components/ui/button';

// Định nghĩa kiểu cho toast
type ToastType = 'success' | 'error' | 'info' | 'warning';

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, headers } = await isAuthenticated(request);

  switch (request.method) {
    case 'POST': {
      try {
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
                type: 'error' as ToastType,
              },
            },
            { headers },
          );
        }

        const res = await createCustomer(data, session!);

        return dataResponse(
          {
            customer: res,
            toast: {
              message: 'Thêm mới Khách hàng thành công!',
              type: 'success' as ToastType,
            },
            redirectTo: `/erp/crm/customers/${res.id}`,
          },
          { headers },
        );
      } catch (error: any) {
        console.error('Error creating customer:', error);
        let errorText = error.message || 'Có lỗi xảy ra khi thêm Khách hàng';

        if (error instanceof Response) {
          // Nếu có lỗi từ server, trả về thông báo lỗi
          errorText = await error.text();
          console.error('Error response:', errorText);
        }
        let errorMessage = 'Có lỗi xảy ra khi thêm Khách hàng';

        // Xử lý lỗi từ API
        if (errorText.includes('Customer code already exists')) {
          errorMessage = 'Mã nhân viên đã tồn tại';
        } else if (errorText.includes('Email already exists')) {
          errorMessage = 'Email đã tồn tại trong hệ thống';
        } else if (errorText.includes('Phản hồi không hợp lệ')) {
          errorMessage =
            'Lỗi từ server: Phản hồi không hợp lệ. Vui lòng kiểm tra lại dữ liệu.';
        } else if (errorText.includes('JSON')) {
          errorMessage =
            'Lỗi từ server: Không thể xử lý dữ liệu. Vui lòng kiểm tra lại.';
        } else if (errorText.includes('Bad data')) {
          errorMessage =
            'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại định dạng dữ liệu.';
        }

        return dataResponse(
          {
            customer: null,
            redirectTo: null,
            toast: {
              message: errorMessage,
              type: 'error' as ToastType,
            },
          },
          { headers },
        );
      }
    }

    default:
      return dataResponse(
        {
          customer: null,
          redirectTo: null,
          toast: { message: 'Method not allowed', type: 'error' as ToastType },
        },
        { headers },
      );
  }
};

export default function NewCustomer() {
  const [isChanged, setIsChanged] = useState(false);
  const location = useLocation();
  const actionData = location.state?.actionData;

  // Hiển thị thông báo nếu có
  if (actionData?.toast) {
    const toastType = actionData.toast.type as ToastType;
    toast[toastType](actionData.toast.message);
  }

  return (
    <>
      {/* Content Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
        <div className='flex items-center'>
          <h1 className='text-xl font-semibold'>Thêm Khách hàng Mới</h1>
          <div className='ml-3 text-gray-500 text-sm flex items-center'>
            <a href='#' className='hover:text-blue-500 transition'>
              Khách hàng
            </a>
            <span className='mx-2'>/</span>
            <span>Khách hàng Mới</span>
          </div>
        </div>

        <div className='flex space-x-2'>
          <Button
            className='bg-white hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm flex items-center border border-gray-200 transition-all duration-300 transform hover:-translate-y-0.5'
            onClick={() => {
              if (confirm('Bạn có chắc chắn muốn hủy bỏ?')) {
                if (window.history.length > 1) window.history.back();
                else window.location.href = '/erp/crm/customers';
              }
            }}
          >
            <span className='material-symbols-outlined text-sm mr-1'>
              cancel
            </span>
            Hủy
          </Button>

          <Button
            className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm flex items-center transition-all duration-300 shadow-sm hover:shadow transform hover:-translate-y-0.5'
            type='submit'
            form='customer-detail-form'
            disabled={!isChanged}
          >
            <span className='material-symbols-outlined text-sm mr-1'>save</span>
            Lưu Khách hàng
          </Button>
        </div>
      </div>

      {/* Form Container */}
      <CustomerDetailForm
        setIsChanged={setIsChanged}
        formId='customer-detail-form'
        type='create'
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
          {/* <button className='bg-white hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm flex items-center border border-gray-200 transition-all duration-300 transform hover:-translate-y-0.5'>
            <span className='material-symbols-outlined text-sm mr-1'>save</span>
            Lưu Bản nháp
          </button> */}
          <Button
            className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm flex items-center transition-all duration-300 shadow-sm hover:shadow transform hover:-translate-y-0.5'
            type='submit'
            form='customer-detail-form'
            disabled={!isChanged}
          >
            <span className='material-symbols-outlined text-sm mr-1'>save</span>
            Lưu Khách hàng
          </Button>
        </div>
      </div>
    </>
  );
}
