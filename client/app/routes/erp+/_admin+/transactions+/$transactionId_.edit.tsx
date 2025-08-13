import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  data as dataResponse,
} from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { useMemo } from 'react';

import TransactionDetailForm from './_components/TransactionDetailForm';
import ContentHeader from '~/components/ContentHeader';
import { parseAuthCookie } from '~/services/cookie.server';
import { getCustomers } from '~/services/customer.server';
import { getCaseServices } from '~/services/case.server';
import {
  getTransactionById,
  updateTransaction,
} from '~/services/transaction.server';
import { isAuthenticated } from '~/services/auth.server';
import { ITransactionUpdate } from '~/interfaces/transaction.interface';
import { generateFormId } from '~/utils';
import { canAccessTransactionManagement } from '~/utils/permission';
import { Save } from 'lucide-react';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const auth = await parseAuthCookie(request);

  if (!canAccessTransactionManagement(auth?.user.usr_role)) {
    throw new Response('Bạn không có quyền truy cập vào trang này.', {
      status: 403,
    });
  }

  const transactionId = params.transactionId as string;
  if (!transactionId) {
    throw new Response('Không tìm thấy giao dịch', { status: 404 });
  }
  const url = new URL(request.url);
  const page = Number(url.searchParams.get('page')) || 1;
  const limit = Number(url.searchParams.get('limit')) || 100;

  const customersPromise = getCustomers(
    new URLSearchParams([
      ['page', page.toString()],
      ['limit', limit.toString()],
      ['sortBy', 'createdAt'],
      ['sortOrder', 'desc'],
    ]),
    auth!,
  ).catch((e) => {
    console.error('Error fetching customers:', e);
    return {
      success: false,
      message: 'Xảy ra lỗi khi lấy danh sách khách hàng',
    };
  });
  const caseServicesPromise = getCaseServices(
    new URLSearchParams([
      ['page', page.toString()],
      ['limit', limit.toString()],
      ['sortBy', 'createdAt'],
      ['sortOrder', 'desc'],
    ]),
    auth!,
  ).catch((e) => {
    console.error('Error fetching case services:', e);
    return {
      success: false,
      message: 'Xảy ra lỗi khi lấy danh sách Hồ sơ vụ việc',
    };
  });
  const transactionPromise = getTransactionById(transactionId, auth!).catch(
    (e) => {
      console.error('Error fetching transaction:', e);
      return {
        success: false,
        message: 'Xảy ra lỗi khi lấy thông tin giao dịch',
      };
    },
  );

  // Trả về dữ liệu cần thiết cho trang TransactionEdit
  return {
    customers: customersPromise,
    caseServices: caseServicesPromise,
    transactionPromise,
  };
};

export default function TransactionEdit() {
  const { customers, caseServices, transactionPromise } =
    useLoaderData<typeof loader>();
  const formId = useMemo(() => generateFormId('transaction-update-form'), []);

  return (
    <div className='space-y-4 md:space-y-6 min-h-screen'>
      {/* Content Header */}
      <ContentHeader
        title='Chỉnh sửa Giao dịch'
        actionContent={
          <>
            <Save className='inline w-4 h-4' />
            <span className='hidden md:inline'>Lưu Giao dịch</span>
            <span className='md:hidden'>Lưu</span>
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
        formId={formId}
        type='update'
        customers={customers}
        caseServices={caseServices}
        transactionPromise={transactionPromise}
      />
    </div>
  );
}

type ToastType = 'success' | 'error' | 'info' | 'warning';

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session, headers } = await isAuthenticated(request);

  const transactionId = params.transactionId as string;
  if (!transactionId) {
    return dataResponse(
      {
        transaction: null,
        toast: {
          message: 'Không tìm thấy giao dịch',
          type: 'error' as ToastType,
        },
        redirectTo: null,
      },
      { headers, status: 404 },
    );
  }

  switch (request.method) {
    case 'PUT': {
      try {
        const formData = await request.formData();
        const data: ITransactionUpdate = {
          code: formData.get('code') as string,
          type: formData.get('type') as 'income' | 'outcome',
          title: formData.get('title') as string,
          amount: +(formData.get('amount') as string) || 0,
          paid: +(formData.get('paid') as string) || 0,
          paymentMethod: formData.get('paymentMethod') as string,
          category: formData.get('category') as string,
          description: formData.get('description') as string,
          customer: formData.get('customer') as string,
          caseService: formData.get('caseService') as string,
          date: formData.get('date') as string,
        };

        // Kiểm tra dữ liệu bắt buộc
        if (
          !data.code ||
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

        const res = await updateTransaction(transactionId, data, session!);

        return dataResponse(
          {
            transaction: res,
            toast: {
              message: 'Cập nhật giao dịch thành công!',
              type: 'success' as ToastType,
            },
            redirectTo: `/erp/transactions/${res.id}`,
          },
          { headers },
        );
      } catch (error: any) {
        console.error('Error updating transaction:', error);

        let errorMessage = 'Có lỗi xảy ra khi cập nhật giao dịch';

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
