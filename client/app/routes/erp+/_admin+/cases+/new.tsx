import {
  Link,
  useLocation,
  data as dataResponse,
  useLoaderData,
  useNavigate,
} from '@remix-run/react';
import { Save } from 'lucide-react';
import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';

import { isAuthenticated } from '~/services/auth.server';
import { createCaseService } from '~/services/case.server';
import { getCustomerById } from '~/services/customer.server';
import {
  ICaseServiceCreate,
  CaseParticipant,
} from '~/interfaces/case.interface';
import CaseDetailForm from './_components/CaseDetailForm';
import { Button } from '~/components/ui/button';
import {
  getUnauthorizedActionResponse,
  parseAuthCookie,
} from '~/services/cookie.server';
import ContentHeader from '~/components/ContentHeader';
import { CASE_SERVICE } from '~/constants/caseService.constant';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import { generateFormId } from '~/utils';
import { useMemo } from 'react';
import { canAccessCaseServices } from '~/utils/permission';
import { IActionFunctionReturn } from '~/interfaces/app.interface';
import { getTasks } from '~/services/task.server';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const session = await parseAuthCookie(request);

  if (!canAccessCaseServices(session?.user.usr_role)) {
    throw new Response('Bạn không có quyền truy cập vào trang này.', {
      status: 403,
    });
  }

  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const customerId = searchParams.get('customerId') || undefined;

  if (!customerId) {
    return { customerPromise: null };
  }

  const customerPromise = getCustomerById(customerId, session!).catch(
    (error) => {
      console.error('Error fetching customer:', error);
      return { success: false, message: 'Có lỗi khi lấy thông tin khách hàng' };
    },
  );

  return { customerPromise };
};

export const action = async ({
  request,
}: ActionFunctionArgs): IActionFunctionReturn => {
  const { session, headers } = await isAuthenticated(request);
  if (!session) {
    return getUnauthorizedActionResponse(dataResponse, headers);
  }

  try {
    switch (request.method) {
      case 'POST': {
        try {
          const url = new URL(request.url);
          const searchParams = url.searchParams;
          const customerId = searchParams.get('customerId');
          if (!customerId) {
            return dataResponse(
              {
                success: false,
                toast: {
                  message: 'Vui lòng chọn Khách hàng trước khi tạo Hồ sơ',
                  type: 'error',
                },
              },
              { headers, status: 400 },
            );
          }

          const formData = await request.formData();

          // Parse pricing data
          const pricingData = formData.get('pricing') as string;
          const pricing = pricingData
            ? JSON.parse(pricingData)
            : {
                baseAmount: 0,
                discounts: 0,
                addOns: 0,
                taxes: [],
              };

          // Parse participants data
          const participantsData = formData.get('participants') as string;
          const participants = participantsData
            ? JSON.parse(participantsData)
            : [];

          // Parse installments data
          const installmentsData = formData.get('installments') as string;
          const installments = installmentsData
            ? JSON.parse(installmentsData)
            : [];

          // Parse incurred costs data
          const incurredCostsData = formData.get('incurredCosts') as string;
          const incurredCosts = incurredCostsData
            ? JSON.parse(incurredCostsData)
            : [];

          const data: ICaseServiceCreate = {
            customer: customerId,
            code: formData.get('code') as string,
            notes: (formData.get('notes') as string) || undefined,
            status:
              (formData.get('status') as keyof typeof CASE_SERVICE.STATUS) ||
              undefined,
            startDate: (formData.get('startDate') as string) || undefined,
            endDate: (formData.get('endDate') as string) || undefined,
            pricing,
            participants,
            installments,
            incurredCosts,
          };

          // Kiểm tra dữ liệu bắt buộc
          if (
            ['customer', 'code'].some(
              (field) => !data[field as keyof ICaseServiceCreate],
            )
          ) {
            return dataResponse(
              {
                success: false,
                toast: {
                  message: 'Vui lòng điền đầy đủ thông tin bắt buộc',
                  type: 'error',
                },
              },
              { headers, status: 400 },
            );
          }

          // Validate pricing data
          if (data.pricing && data.pricing.baseAmount < 0) {
            return dataResponse(
              {
                success: false,
                toast: {
                  message: 'Giá cơ bản không thể âm',
                  type: 'error',
                },
              },
              { headers, status: 400 },
            );
          }

          // Validate installments sequence numbers are unique
          if (data.installments && data.installments.length > 0) {
            const sequences = data.installments.map((inst) => inst.seq);
            const uniqueSequences = new Set(sequences);
            if (sequences.length !== uniqueSequences.size) {
              return dataResponse(
                {
                  success: false,
                  toast: {
                    message: 'Số thứ tự các kỳ thanh toán phải duy nhất',
                    type: 'error',
                  },
                },
                { headers, status: 400 },
              );
            }
          }

          const res = await createCaseService(data, session!);

          return dataResponse(
            {
              success: true,
              toast: {
                message: 'Thêm mới Hồ sơ thành công!',
                type: 'success',
              },
              redirectTo: `/erp/cases/${res.id}`,
            },
            { headers },
          );
        } catch (error: any) {
          console.error('Error creating case:', error);
          const errorMessage = error.message || 'Có lỗi xảy ra khi thêm Hồ sơ';

          return dataResponse(
            {
              success: false,
              toast: {
                message: errorMessage,
                type: 'error',
              },
            },
            { headers, status: 500 },
          );
        }
      }

      default:
        return dataResponse(
          {
            success: false,
            toast: { message: 'Method not allowed', type: 'error' },
          },
          { headers, status: 405 },
        );
    }
  } catch (res) {
    console.error('Error in action function:', res);
    return dataResponse(
      {
        success: false,
        toast: {
          message: 'Có lỗi xảy ra trong quá trình xử lý',
          type: 'error',
        },
      },
      { headers, status: 500 },
    );
  }
};

export default function NewCase() {
  const { customerPromise } = useLoaderData<typeof loader>();
  const formId = useMemo(() => generateFormId('case-detail-form'), []);
  const navigate = useNavigate();

  return (
    <div className='space-y-4 sm:space-y-6 min-h-screen mx-auto'>
      {/* Content Header */}
      <ContentHeader
        title='Thêm Hồ sơ mới'
        actionContent={
          <>
            <Save className='inline w-4 h-4' />
            <span className='hidden sm:inline'>Lưu Hồ sơ</span>
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
      {customerPromise ? (
        <CaseDetailForm
          formId={formId}
          type='create'
          customerPromise={customerPromise}
        />
      ) : (
        <AlertDialog open={true}>
          <AlertDialogContent className='max-w-md sm:max-w-lg'>
            <AlertDialogHeader>
              <AlertDialogTitle className='text-base sm:text-lg'>
                Vui lòng chọn Khách hàng trước khi tạo Hồ sơ
              </AlertDialogTitle>
              <AlertDialogDescription className='text-sm sm:text-base'>
                Bạn cần chọn một Khách hàng để liên kết với Hồ sơ mới. Vui lòng
                quay lại trang danh sách Khách hàng để thực hiện thao tác này.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className='flex-col sm:flex-row gap-2 sm:gap-0'>
              <AlertDialogCancel
                type='button'
                onClick={() => {
                  navigate(-1);
                }}
                className='w-full sm:w-auto'
              >
                Hủy
              </AlertDialogCancel>

              <Button variant={'primary'} className='w-full sm:w-auto'>
                <Link
                  to='/erp/customers'
                  prefetch='intent'
                  className='flex items-center justify-center'
                >
                  Chọn Khách hàng
                </Link>
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
