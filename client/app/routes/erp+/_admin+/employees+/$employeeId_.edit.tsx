import { useLoaderData, useNavigate, data } from '@remix-run/react';
import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { isAuthenticated } from '~/services/auth.server';
import { getEmployeeById, updateEmployee } from '~/services/employee.server';
import { getRoles } from '~/services/role.server';
import EmployeeDetailForm from './_components/EmployeeDetailForm';
import { useState } from 'react';
import { parseAuthCookie } from '~/services/cookie.server';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const auth = await parseAuthCookie(request);
  const { employeeId } = params;

  if (!employeeId) {
    throw new Response('Không tìm thấy nhân sự.', {
      status: 404,
    });
  }

  try {
    const [employee, roles] = await Promise.all([
      getEmployeeById(employeeId, auth!),
      getRoles(auth!),
    ]);

    return data({
      employee,
      roles,
    });
  } catch (error: any) {
    throw new Response(error.message || error.statusText, {
      status: error.status || 500,
    });
  }
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  switch (request.method) {
    case 'PUT':
      try {
        const { session, headers } = await isAuthenticated(request);

        const { employeeId } = params;
        if (!employeeId) {
          throw new Response('Không tìm thấy nhân sự.', {
            status: 404,
          });
        }
        const formData = await request.formData();
        const updateData = Object.fromEntries(formData.entries());

        const updatedEmployee = await updateEmployee(
          employeeId,
          updateData,
          session!,
        );
        return data(
          {
            employee: updatedEmployee,
            toast: {
              message: 'Cập nhật thông tin nhân sự thành công!',
              type: 'success',
            },
          },
          { headers },
        );
      } catch (error: any) {
        return {
          toast: { message: error.message || 'Update failed', type: 'error' },
        };
      }

    default:
      return {
        toast: { message: 'Method not allowed', type: 'error' },
      };
  }
};

export default function HRMProfile() {
  const { employee, roles } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const [isChanged, setIsChanged] = useState(false);

  const formId = 'employee-profile-form';
  return (
    <>
      {/* Content Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
        <div className='flex items-center'>
          <h1 className='text-xl font-semibold'>Employee Profile</h1>
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
      <EmployeeDetailForm
        formId={formId}
        employee={employee}
        setIsChanged={setIsChanged}
        roles={roles}
        type='update'
      />
    </>
  );
}
