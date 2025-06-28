import {
  Link,
  useLocation,
  data as dataResponse,
  useLoaderData,
} from '@remix-run/react';

import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { isAuthenticated } from '~/services/auth.server';
import { createTransaction } from '~/services/transaction.server';
import { toast } from 'react-toastify';
import { ITransactionCreate } from '~/interfaces/transaction.interface';
import TransactionDetailForm from './_components/TransactionDetailForm';
import ContentHeader from '~/components/ContentHeader';
import { parseAuthCookie } from '~/services/cookie.server';
import { getCustomers } from '~/services/customer.server';
import { getCaseServices } from '~/services/case.server';

// Định nghĩa kiểu cho toast
type ToastType = 'success' | 'error' | 'info' | 'warning';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const auth = await parseAuthCookie(request);
  const url = new URL(request.url);
  const caseId = url.searchParams.get('caseId');
  const customerId = url.searchParams.get('customerId');
  const page = Number(url.searchParams.get('page')) || 1;
  const limit = Number(url.searchParams.get('limit')) || 100;

  // Lấy danh sách khách hàng
  const customersPromise = getCustomers(
    {},
    {
      page,
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
    auth!,
  ).catch((e: any) => {
    console.error('Error fetching customers:', e);
    return {
      success: false,
      message: 'Xảy ra lỗi khi lấy danh sách khách hàng',
    };
  });

  // Lấy danh sách hồ sơ vụ việc
  const caseServicesPromise = getCaseServices(
    {},
    {
      page,
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
    auth!,
  ).catch((e: any) => {
    console.error('Error fetching case services:', e);
    return {
      success: false,
      message: 'Xảy ra lỗi khi lấy danh sách hồ sơ vụ việc',
    };
  });

  // Trả về dữ liệu cần thiết cho trang NewTransaction
  return {
    customersPromise,
    caseServicesPromise,
    initialCustomerId: customerId,
    initialCaseId: caseId,
  };
};

export default function NewTransaction() {
  const {
    customersPromise,
    caseServicesPromise,
    initialCustomerId,
    initialCaseId,
  } = useLoaderData<typeof loader>();
  const location = useLocation();
  const actionData = location.state?.actionData;

  // Hiển thị thông báo nếu có
  if (actionData?.toast) {
    const toastType = actionData.toast.type as ToastType;
    toast[toastType](actionData.toast.message);
  }

  const formId = 'transaction-detail-form';

  return (
    <div className='w-full space-y-6'>
      {/* Content Header */}
      <ContentHeader
        title='Thêm mới giao dịch'
        actionContent={
          <>
            <span className='material-symbols-outlined text-sm mr-1'>save</span>
            Lưu giao dịch
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
      <TransactionDetailForm
        customers={customersPromise}
        caseServices={caseServicesPromise}
        formId={formId}
        type='create'
        initialCustomerId={initialCustomerId}
        initialCaseId={initialCaseId}
      />
    </div>
  );
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, headers } = await isAuthenticated(request);

  switch (request.method) {
    case 'POST': {
      try {
        const formData = await request.formData();

        // Tạo dữ liệu từ form
        const data: ITransactionCreate = {
          code: formData.get('code') as string,
          type: formData.get('type') as 'income' | 'outcome',
          title: formData.get('title') as string,
          amount: Number(formData.get('amount')) || 0,
          paid: Number(formData.get('paid')) || 0,
          paymentMethod: formData.get('paymentMethod') as string,
          category: formData.get('category') as string,
          description: formData.get('description') as string,
          createdBy: session!.user.id,
          customer: (formData.get('customer') as string) || undefined,
          caseService: (formData.get('caseService') as string) || undefined,
        };
        console.log(data);
        console.log('amount: ', formData.get('amount'));

        // Kiểm tra dữ liệu bắt buộc
        if (
          !data.code ||
          !data.type ||
          !data.title ||
          !data.amount ||
          !data.paymentMethod ||
          !data.category
        ) {
          return dataResponse(
            {
              transaction: null,
              toast: {
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc',
                type: 'error' as ToastType,
              },
              redirectTo: null,
            },
            { headers, status: 400 },
          );
        }

        const res = await createTransaction(data, session!);

        return dataResponse(
          {
            transaction: res,
            toast: {
              message: 'Thêm mới giao dịch thành công!',
              type: 'success' as ToastType,
            },
            redirectTo: `/erp/transactions/${res.id}`,
          },
          { headers },
        );
      } catch (error: any) {
        console.error('Error creating transaction:', error);

        let errorMessage = 'Có lỗi xảy ra khi thêm giao dịch';

        return dataResponse(
          {
            transaction: null,
            toast: {
              message: errorMessage,
              type: 'error' as ToastType,
            },
            redirectTo: null,
          },
          { headers, status: 500 },
        );
      }
    }

    default:
      return dataResponse(
        {
          transaction: null,
          toast: { message: 'Method not allowed', type: 'error' as ToastType },
          redirectTo: null,
        },
        { headers, status: 405 },
      );
  }
};
