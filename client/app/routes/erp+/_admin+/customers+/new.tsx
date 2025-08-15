import { useLocation, data as dataResponse } from '@remix-run/react';
import { Save } from 'lucide-react';
import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { toast } from 'react-toastify';

import { isAuthenticated } from '~/services/auth.server';
import { createCustomer } from '~/services/customer.server';
import { ICustomerCreate } from '~/interfaces/customer.interface';
import CustomerDetailForm from './_components/CustomerDetailForm';
import ContentHeader from '~/components/ContentHeader';
import { generateFormId } from '~/utils';
import { useMemo } from 'react';
import { parseAuthCookie } from '~/services/cookie.server';
import { canAccessCustomerManagement } from '~/utils/permission';
import { IActionFunctionReturn } from '~/interfaces/app.interface';

// Định nghĩa kiểu cho toast
type ToastType = 'success' | 'error' | 'info' | 'warning';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await parseAuthCookie(request);

  if (!canAccessCustomerManagement(user?.user.usr_role)) {
    throw new Response('Bạn không có quyền truy cập vào trang này.', {
      status: 403,
    });
  }

  return {};
};

export const action = async ({
  request,
}: ActionFunctionArgs): IActionFunctionReturn => {
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
          provinceId: formData.get('provinceId') as string,
          wardId: formData.get('wardId') as string,
          street: formData.get('street') as string,
          sex: formData.get('sex') as string,
          birthDate: formData.get('birthDate') as string,
          code: formData.get('code') as string,
          notes: formData.get('notes') as string,
          contactChannel: formData.get('contactChannel') as string,
          source: formData.get('source') as string,
          createdAt: formData.get('createdAt') as string,
        };

        // Kiểm tra dữ liệu bắt buộc
        if (
          [
            'firstName',
            'msisdn',
            'code',
            'provinceId',
            'wardId',
            'street',
          ].some((field) => !data[field as keyof ICustomerCreate])
        ) {
          return dataResponse(
            {
              success: false,
              toast: {
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc',
                type: 'error',
              },
            },
            { headers },
          );
        }

        const res = await createCustomer(data, session!);

        return dataResponse(
          {
            success: true,
            toast: {
              message: 'Thêm mới Khách hàng thành công!',
              type: 'success',
            },
            redirectTo: `/erp/customers/${res.id}`,
          },
          { headers },
        );
      } catch (error: any) {
        console.error('Error creating customer:', error);
        const errorMessage =
          error.message || 'Có lỗi xảy ra khi thêm Khách hàng';

        return dataResponse(
          {
            success: false,
            toast: {
              message: errorMessage,
              type: 'error',
            },
          },
          { headers },
        );
      }
    }

    default:
      return dataResponse(
        {
          success: false,
          toast: { message: 'Method not allowed', type: 'error' },
        },
        { headers },
      );
  }
};

export default function NewCustomer() {
  const location = useLocation();
  const actionData = location.state?.actionData;

  // Hiển thị thông báo nếu có
  if (actionData?.toast) {
    const toastType = actionData.toast.type as ToastType;
    toast[toastType](actionData.toast.message);
  }

  const formId = useMemo(() => generateFormId('customer-detail-form'), []);

  return (
    <div className='space-y-4 md:space-y-6 min-h-screen'>
      {/* Content Header */}
      <ContentHeader
        title='Thêm Khách hàng mới'
        actionContent={
          <>
            <Save className='inline' />
            <span className='hidden sm:inline'>Lưu Khách hàng</span>
            <span className='sm:hidden'>Lưu</span>
          </>
        }
        actionHandler={() => {
          const form = document.getElementById(formId) as HTMLFormElement;
          if (form) {
            form.requestSubmit();
          }
        }}
      />

      {/* Form Container */}
      <CustomerDetailForm formId={formId} type='create' />
    </div>
  );
}
