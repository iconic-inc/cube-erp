import { deleteEmployee, getEmployeeById } from '~/services/employee.server';
import { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { isAuthenticated } from '~/services/auth.server';
import { data, useLoaderData, useNavigate } from '@remix-run/react';
import { getLast7DaysStats } from '~/services/attendance.server';
import { parseAuthCookie } from '~/services/cookie.server';
import ContentHeader from '~/components/ContentHeader';
import EmployeeDetail from './_components/EmployeeDetail';
import EmployeeAttendanceList from './_components/EmployeeAttendanceList';
import { Edit, Pen } from 'lucide-react';
import { canAccessEmployeeManagement } from '~/utils/permission';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const session = await parseAuthCookie(request);

  if (!canAccessEmployeeManagement(session?.user.usr_role)) {
    throw new Response('Bạn không có quyền truy cập vào trang này.', {
      status: 403,
    });
  }

  const employeeId = params.employeeId;

  if (!employeeId) {
    throw new Response('Employee ID is required', { status: 400 });
  }

  const employeePromise = getEmployeeById(employeeId, session!).catch(
    (error) => {
      console.error('Error fetching employee:', error);
      return {
        success: false,
        message: error.message || 'Có lỗi khi lấy thông tin nhân viên',
      };
    },
  );

  // Get employee first to get user ID for attendance
  const attendancePromise = getEmployeeById(employeeId, session!)
    .then((employee) => {
      return getLast7DaysStats(employee.emp_user.id, session!);
    })
    .catch((error) => {
      console.error('Error fetching attendance stats:', error);
      return {
        success: false,
        message: error.message || 'Có lỗi khi lấy thống kê chấm công',
      };
    });

  return {
    employeeId,
    employeePromise,
    attendancePromise,
  };
};
export default function EmployeeDetails() {
  const { employeeId, employeePromise, attendancePromise } =
    useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <div className='space-y-4 sm:space-y-6 min-h-screen mx-auto'>
      <ContentHeader
        title='Chi tiết Nhân viên'
        actionContent={
          <>
            <Edit className='w-4 h-4' />
            <span className='hidden sm:inline'>Chỉnh sửa Nhân viên</span>
            <span className='sm:hidden'>Chỉnh sửa</span>
          </>
        }
        actionHandler={() => {
          navigate(`./edit`);
        }}
        backHandler={() => navigate('/erp/employees')}
      />

      {/* Employee Details Card */}
      <EmployeeDetail employeePromise={employeePromise} />

      {/* Employee Attendance List Card */}
      <EmployeeAttendanceList
        employeeId={employeeId}
        attendancePromise={attendancePromise}
      />
    </div>
  );
}

export const action = async ({ request, params }: ActionFunctionArgs) => {
  switch (request.method) {
    case 'DELETE':
      const { session, headers } = await isAuthenticated(request);
      await deleteEmployee(params.employeeId!, session!);
      return data(
        {
          toast: {
            type: 'success' as const,
            message: 'Xóa nhân viên thành công',
          },
        },
        { headers },
      );
    default:
      return data(
        {
          toast: {
            type: 'error' as const,
            message: 'Phương thức không hợp lệ',
          },
        },
        {
          status: 405,
          statusText: 'Method Not Allowed',
        },
      );
  }
};
