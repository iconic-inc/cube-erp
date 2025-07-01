import { useLoaderData, data as dataResponse, Link } from '@remix-run/react';
import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { isAuthenticated } from '~/services/auth.server';
import { getEmployeeById, updateEmployee } from '~/services/employee.server';
import { getRoles } from '~/services/role.server';
import EmployeeDetailForm from './_components/EmployeeDetailForm';
import { parseAuthCookie } from '~/services/cookie.server';
import { IEmployeeUpdate } from '~/interfaces/employee.interface';
import ContentHeader from '~/components/ContentHeader';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { generateFormId } from '~/utils';
import { useMemo } from 'react';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const auth = await parseAuthCookie(request);
  const { employeeId } = params;

  if (!employeeId) {
    throw new Response('Không tìm thấy nhân sự.', {
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
                message: 'Không tìm thấy nhân sự.',
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
              message: 'Cập nhật thông tin nhân sự thành công!',
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
    <div className=''>
      {/* Content Header */}
      <ContentHeader
        title='Chỉnh sửa nhân viên'
        backHandler={() => window.history.back()}
        actionContent={
          <div className='flex space-x-3'>
            <Link
              to={`/erp/employees/${employeeId}`}
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

      {/* Employee Edit Form */}
      <div className='mt-8'>
        <EmployeeDetailForm
          formId={formId}
          type='update'
          employeePromise={employeePromise}
          rolesPromise={rolesPromise}
          action={`/erp/employees/${employeeId}/edit`}
        />
      </div>
    </div>
  );
}
