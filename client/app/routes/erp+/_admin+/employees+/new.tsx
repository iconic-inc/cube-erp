import {
  useLoaderData,
  useLocation,
  data as dataResponse,
} from '@remix-run/react';
import { Save } from 'lucide-react';
import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { toast } from 'react-toastify';

import { getRoles } from '~/services/role.server';
import EmployeeDetailForm from './_components/EmployeeDetailForm';
import { isAuthenticated } from '~/services/auth.server';
import { createEmployee } from '~/services/employee.server';
import { parseAuthCookie } from '~/services/cookie.server';
import { IEmployeeCreate } from '~/interfaces/employee.interface';
import ContentHeader from '~/components/ContentHeader';
import { generateFormId } from '~/utils';
import { useMemo } from 'react';
import { canAccessEmployeeManagement } from '~/utils/permission';

// Định nghĩa kiểu cho toast
type ToastType = 'success' | 'error' | 'info' | 'warning';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const user = await parseAuthCookie(request);

    if (!canAccessEmployeeManagement(user?.user.usr_role)) {
      throw new Response('Bạn không có quyền truy cập vào trang này.', {
        status: 403,
      });
    }

    const rolesPromise = getRoles(user!).catch((e) => {
      console.error('Error fetching roles:', e);
      return { success: false, message: 'Có lỗi khi lấy danh sách quyền' };
    });

    return { rolesPromise };
  } catch (error) {
    console.error('Error in loader:', error);
    return {
      rolesPromise: Promise.resolve({
        success: false,
        message: 'Có lỗi xảy ra',
      }),
    };
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, headers } = await isAuthenticated(request);

  switch (request.method) {
    case 'POST': {
      try {
        const formData = await request.formData();
        const data: IEmployeeCreate = {
          // user data
          firstName: formData.get('firstName') as string,
          lastName: formData.get('lastName') as string,
          email: formData.get('email') as string,
          msisdn: formData.get('msisdn') as string,
          password: formData.get('password') as string,
          role: formData.get('role') as string,
          address: formData.get('address') as string,
          sex: formData.get('sex') as string,
          avatar: formData.get('avatar') as string,
          birthdate: formData.get('birthdate') as string,
          username: formData.get('username') as string,
          status: formData.get('status') as string,
          // employee data
          code: formData.get('employeeCode') as string,
          position: formData.get('position') as string,
          department: formData.get('department') as string,
          joinDate: formData.get('joinDate') as string,
        };
        console.log(data);

        // Kiểm tra dữ liệu bắt buộc
        if (
          ['code', 'firstName', 'lastName', 'email', 'role'].some(
            (field) => !data[field as keyof IEmployeeCreate],
          )
        ) {
          return dataResponse(
            {
              employee: null,
              redirectTo: null,
              toast: {
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc',
                type: 'error' as ToastType,
              },
            },
            { headers },
          );
        }

        // Kiểm tra mật khẩu
        if (!data.password || data.password.length < 6) {
          return dataResponse(
            {
              employee: null,
              redirectTo: null,
              toast: {
                message: 'Mật khẩu phải có ít nhất 6 ký tự',
                type: 'error' as ToastType,
              },
            },
            { headers },
          );
        }

        // Đảm bảo role là ObjectId
        if (
          data.role &&
          typeof data.role === 'string' &&
          !data.role.match(/^[0-9a-fA-F]{24}$/)
        ) {
          console.error('Invalid role format:', data.role);
          return dataResponse(
            {
              employee: null,
              redirectTo: null,
              toast: {
                message:
                  'Role không hợp lệ. Vui lòng chọn quyền truy cập hợp lệ.',
                type: 'error' as ToastType,
              },
            },
            { headers },
          );
        }

        const res = await createEmployee(data, session!);

        return dataResponse(
          {
            employee: res,
            toast: {
              message: 'Thêm mới Nhân viên thành công!',
              type: 'success' as ToastType,
            },
            redirectTo: `/erp/employees/${res.id}`,
          },
          { headers },
        );
      } catch (error: any) {
        console.error('Error creating employee:', error);
        let errorMessage = error.message || 'Có lỗi xảy ra khi thêm Nhân viên';

        return dataResponse(
          {
            employee: null,
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
          employee: null,
          toast: { message: 'Method not allowed', type: 'error' as ToastType },
        },
        { headers },
      );
  }
};

export default function NewEmployee() {
  const { rolesPromise } = useLoaderData<typeof loader>();
  const location = useLocation();
  const actionData = location.state?.actionData;

  // Hiển thị thông báo nếu có
  if (actionData?.toast) {
    const toastType = actionData.toast.type as ToastType;
    toast[toastType](actionData.toast.message);
  }

  const formId = useMemo(() => generateFormId('employee-detail-form'), []);

  console.log(formId);
  return (
    <div className='space-y-4 md:space-y-6 min-h-screen'>
      {/* Content Header */}
      <ContentHeader
        title='Thêm Nhân viên mới'
        actionContent={
          <>
            <Save className='inline' />
            Lưu Nhân viên
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
      <EmployeeDetailForm
        rolesPromise={rolesPromise}
        formId={formId}
        type='create'
      />
    </div>
  );
}
