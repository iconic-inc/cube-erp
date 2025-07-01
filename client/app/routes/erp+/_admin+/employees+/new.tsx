import { useState, useMemo } from 'react';
import {
  Link,
  useLoaderData,
  useLocation,
  data as dataResponse,
} from '@remix-run/react';

import { getRoles } from '~/services/role.server';
import EmployeeDetailForm from '../../../../components/EmployeeDetailForm';
import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { authenticator, isAuthenticated } from '~/services/auth.server';
import Defer from '~/components/Defer';
import { createEmployee } from '~/services/employee.server';
import { toast } from 'react-toastify';
import { parseAuthCookie } from '~/services/cookie.server';
import { IEmployeeCreate } from '~/interfaces/employee.interface';
import { generateFormId } from '~/utils';

// Định nghĩa kiểu cho toast
type ToastType = 'success' | 'error' | 'info' | 'warning';

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

        // Kiểm tra dữ liệu bắt buộc
        if (
          !data.code ||
          !data.firstName ||
          !data.lastName ||
          !data.email ||
          !data.role
        ) {
          return dataResponse(
            {
              employee: null,
              toast: {
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc',
                type: 'error' as ToastType,
              },
            },
            { headers },
          );
        }

        // Kiểm tra mật khẩu
        if (!data.password || data.password.length < 8) {
          return dataResponse(
            {
              employee: null,
              toast: {
                message: 'Mật khẩu phải có ít nhất 8 ký tự',
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
              message: 'Thêm mới nhân sự thành công!',
              type: 'success' as ToastType,
            },
            redirectTo: '/erp/employees',
          },
          { headers },
        );
      } catch (error: any) {
        console.error('Error creating employee:', error);
        let errorText = error.message || 'Có lỗi xảy ra khi thêm nhân sự';

        if (error instanceof Response) {
          // Nếu có lỗi từ server, trả về thông báo lỗi
          errorText = await error.text();
          console.error('Error response:', errorText);
        }
        let errorMessage = 'Có lỗi xảy ra khi thêm nhân sự';

        // Xử lý lỗi từ API
        if (errorText.includes('Employee code already exists')) {
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
            employee: null,
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

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const user = await parseAuthCookie(request);

    return {
      roles: getRoles(user!).catch((e) => {
        console.error(e);
        return [];
      }),
    };
  } catch (error) {
    console.error(error);

    return {
      roles: Promise.resolve([] as any[]),
    };
  }
};

export default function NewEmployee() {
  const { roles } = useLoaderData<typeof loader>();
  const [isChanged, setIsChanged] = useState(false);
  const location = useLocation();
  const actionData = location.state?.actionData;

  // Hiển thị thông báo nếu có
  if (actionData?.toast) {
    const toastType = actionData.toast.type as ToastType;
    toast[toastType](actionData.toast.message);
  }
  const formId = useMemo(() => generateFormId('employee-create-form'), []);

  return (
    <>
      {/* Content Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
        <div className='flex items-center'>
          <h1 className='text-xl font-semibold'>Thêm Nhân sự Mới</h1>
          <div className='ml-3 text-gray-500 text-sm flex items-center'>
            <a href='#' className='hover:text-blue-500 transition'>
              Nhân sự
            </a>
            <span className='mx-2'>/</span>
            <span>Nhân sự Mới</span>
          </div>
        </div>

        <div className='flex space-x-2'>
          <button
            className='bg-white hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm flex items-center border border-gray-200 transition-all duration-300 transform hover:-translate-y-0.5'
            onClick={() => {
              if (confirm('Bạn có chắc chắn muốn hủy bỏ?')) {
                if (window.history.length > 1) window.history.back();
                else window.location.href = '/erp/employees';
              }
            }}
          >
            <span className='material-symbols-outlined text-sm mr-1'>
              cancel
            </span>
            Hủy
          </button>

          <button
            className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm flex items-center transition-all duration-300 shadow-sm hover:shadow transform hover:-translate-y-0.5'
            type='submit'
            form={formId}
            disabled={!isChanged}
          >
            <span className='material-symbols-outlined text-sm mr-1'>save</span>
            Lưu Nhân sự
          </button>
        </div>
      </div>

      {/* Form Container */}
      <div className='bg-white rounded-lg shadow-sm p-6 mb-6'>
        <Defer resolve={roles}>
          {(data) => (
            <EmployeeDetailForm
              roles={data}
              setIsChanged={setIsChanged}
              formId={formId}
              type='create'
            />
          )}
        </Defer>
      </div>

      {/* Bottom Action Buttons */}
      <div className='flex justify-between items-center'>
        <Link
          to='/erp/employees'
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
          <button
            className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm flex items-center transition-all duration-300 shadow-sm hover:shadow transform hover:-translate-y-0.5'
            type='submit'
            form={formId}
            disabled={!isChanged}
          >
            <span className='material-symbols-outlined text-sm mr-1'>save</span>
            Lưu Nhân sự
          </button>
        </div>
      </div>
    </>
  );
}
