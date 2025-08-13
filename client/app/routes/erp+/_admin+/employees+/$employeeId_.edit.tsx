import { useLoaderData, data as dataResponse } from '@remix-run/react';
import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { isAuthenticated } from '~/services/auth.server';
import { getEmployeeById, updateEmployee } from '~/services/employee.server';
import { getRoles } from '~/services/role.server';
import EmployeeDetailForm from './_components/EmployeeDetailForm';
import { parseAuthCookie } from '~/services/cookie.server';
import ContentHeader from '~/components/ContentHeader';
import { Save } from 'lucide-react';
import { generateFormId } from '~/utils';
import { useMemo } from 'react';
import { canAccessEmployeeManagement } from '~/utils/permission';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const auth = await parseAuthCookie(request);

  if (!canAccessEmployeeManagement(auth?.user.usr_role)) {
    throw new Response('Bạn không có quyền truy cập vào trang này.', {
      status: 403,
    });
  }

  const { employeeId } = params;

  if (!employeeId) {
    throw new Response('Không tìm thấy Nhân viên.', {
      status: 404,
    });
  }

  const employeePromise = getEmployeeById(employeeId, auth!).catch((error) => {
    console.error('Error fetching employee:', error);
    return {
      success: false,
      message: error.message || 'Có lỗi khi lấy thông tin nhân viên',
    };
  });

  const rolesPromise = getRoles(auth!).catch((error) => {
    console.error('Error fetching roles:', error);
    return {
      success: false,
      message: error.message || 'Có lỗi khi lấy danh sách vai trò',
    };
  });

  return dataResponse({
    employeePromise,
    rolesPromise,
    employeeId,
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session, headers } = await isAuthenticated(request);

  switch (request.method) {
    case 'PUT':
      try {
        const { employeeId } = params;
        if (!employeeId) {
          return dataResponse(
            {
              employee: null,
              redirectTo: null,
              toast: {
                message: 'Không tìm thấy Nhân viên.',
                type: 'error',
              },
            },
            { headers },
          );
        }
        const formData = await request.formData();
        const updateData = Object.fromEntries(formData.entries()) as any;

        const updatedEmployee = await updateEmployee(
          employeeId,
          updateData,
          session!,
        );
        return dataResponse(
          {
            employee: updatedEmployee,
            redirectTo: `/erp/employees/${updatedEmployee.id}`,
            toast: {
              message: 'Cập nhật thông tin Nhân viên thành công!',
              type: 'success',
            },
          },
          { headers },
        );
      } catch (error: any) {
        return dataResponse(
          {
            employee: null,
            redirectTo: null,
            toast: { message: error.message || 'Update failed', type: 'error' },
          },
          { headers },
        );
      }

    default:
      return dataResponse(
        {
          employee: null,
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

export default function EmployeeEditPage() {
  const { employeePromise, rolesPromise, employeeId } =
    useLoaderData<typeof loader>();

  const formId = useMemo(() => generateFormId('employee-edit-form'), []);

  return (
    <div className='space-y-4 sm:space-y-6 min-h-screen mx-auto'>
      {/* Content Header */}
      <ContentHeader
        title='Chỉnh sửa nhân viên'
        actionContent={
          <>
            <Save className='w-4 h-4 sm:w-3 sm:h-3' />
            <span className='hidden sm:inline'>Cập nhật Nhân viên</span>
            <span className='sm:hidden'>Cập nhật</span>
          </>
        }
        actionHandler={() => {
          const form = document.getElementById(formId) as HTMLFormElement;
          if (form) {
            form.requestSubmit();
          }
        }}
      />

      {/* Employee Edit Form */}
      <div className='mt-4 sm:mt-8'>
        <EmployeeDetailForm
          formId={formId}
          type='update'
          employeePromise={employeePromise}
          rolesPromise={rolesPromise}
        />
      </div>
    </div>
  );
}
