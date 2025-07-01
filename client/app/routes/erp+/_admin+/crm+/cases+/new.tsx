import {
  Link,
  useLocation,
  data as dataResponse,
  useLoaderData,
  useNavigate,
} from '@remix-run/react';
import { Save } from 'lucide-react';
import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { toast } from 'react-toastify';

import { isAuthenticated } from '~/services/auth.server';
import { createCaseService } from '~/services/case.server';
import { getCustomerById } from '~/services/customer.server';
import { ICaseServiceCreate } from '~/interfaces/case.interface';
import CaseDetailForm from './_components/CaseDetailForm';
import { Button } from '~/components/ui/button';
import { getEmployees } from '~/services/employee.server';
import { parseAuthCookie } from '~/services/cookie.server';
import ContentHeader from '~/components/ContentHeader';
import { CASE_SERVICE } from '../../../../../constants/caseService.constant';
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

// Định nghĩa kiểu cho toast
type ToastType = 'success' | 'error' | 'info' | 'warning';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const session = await parseAuthCookie(request);

  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const customerId = searchParams.get('customerId') || undefined;

  if (!customerId) {
    return { customerPromise: null, employeesPromise: null };
  }

  // Load customers and employees for form selection
  const employeesPromise = getEmployees({}, {}, session!).catch((error) => {
    console.error('Error fetching employees:', error);
    return { success: false, message: 'Có lỗi khi lấy danh sách nhân viên' };
  });

  const customerPromise = getCustomerById(customerId, session!).catch(
    (error) => {
      console.error('Error fetching customer:', error);
      return { success: false, message: 'Có lỗi khi lấy thông tin khách hàng' };
    },
  );

  return { customerPromise, employeesPromise };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, headers } = await isAuthenticated(request);

  switch (request.method) {
    case 'POST': {
      try {
        const url = new URL(request.url);
        const searchParams = url.searchParams;
        const customerId = searchParams.get('customerId');
        if (!customerId) {
          return dataResponse(
            {
              case: null,
              redirectTo: null,
              toast: {
                message: 'Vui lòng chọn Khách hàng trước khi tạo Hồ sơ',
                type: 'error' as ToastType,
              },
            },
            { headers },
          );
        }

        const formData = await request.formData();
        const data: ICaseServiceCreate = {
          customer: customerId,
          code: formData.get('code') as string,
          leadAttorney: formData.get('leadAttorney') as string,
          assignees: (formData.getAll('assignees') as string[]) || [],
          notes: (formData.get('notes') as string) || undefined,
          status:
            (formData.get('status') as keyof typeof CASE_SERVICE.STATUS) ||
            undefined,
          startDate: (formData.get('startDate') as string) || undefined,
          endDate: (formData.get('endDate') as string) || undefined,
        };

        // Kiểm tra dữ liệu bắt buộc
        if (
          ['customer', 'code', 'leadAttorney'].some(
            (field) => !data[field as keyof ICaseServiceCreate],
          )
        ) {
          return dataResponse(
            {
              case: null,
              redirectTo: null,
              toast: {
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc',
                type: 'error' as ToastType,
              },
            },
            { headers },
          );
        }

        const res = await createCaseService(data, session!);

        return dataResponse(
          {
            case: res,
            toast: {
              message: 'Thêm mới Hồ sơ thành công!',
              type: 'success' as ToastType,
            },
            redirectTo: `/erp/crm/cases/${res.id}`,
          },
          { headers },
        );
      } catch (error: any) {
        console.error('Error creating case:', error);
        const errorMessage = error.message || 'Có lỗi xảy ra khi thêm Hồ sơ';

        return dataResponse(
          {
            case: null,
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
          case: null,
          redirectTo: null,
          toast: { message: 'Method not allowed', type: 'error' as ToastType },
        },
        { headers },
      );
  }
};

export default function NewCase() {
  const location = useLocation();
  const actionData = location.state?.actionData;
  const { customerPromise, employeesPromise } = useLoaderData<typeof loader>();

  // Hiển thị thông báo nếu có
  if (actionData?.toast) {
    const toastType = actionData.toast.type as ToastType;
    toast[toastType](actionData.toast.message);
  }

  const formId = useMemo(() => generateFormId('case-detail-form'), []);
  const navigate = useNavigate();

  return (
    <div className='w-full space-y-8'>
      {/* Content Header */}
      <ContentHeader
        title='Thêm Hồ sơ mới'
        actionContent={
          <>
            <Save className='inline mr-2' />
            Lưu Hồ sơ
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
      {customerPromise && employeesPromise ? (
        <CaseDetailForm
          formId={formId}
          type='create'
          customerPromise={customerPromise}
          employeesPromise={employeesPromise}
        />
      ) : (
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Vui lòng chọn Khách hàng trước khi tạo Hồ sơ
              </AlertDialogTitle>
              <AlertDialogDescription>
                Bạn cần chọn một Khách hàng để liên kết với Hồ sơ mới. Vui lòng
                quay lại trang danh sách Khách hàng để thực hiện thao tác này.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                type='button'
                onClick={() => {
                  navigate(-1);
                }}
              >
                Hủy
              </AlertDialogCancel>

              <Button variant={'primary'}>
                <Link to='/erp/crm/customers'>Chọn Khách hàng</Link>
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
