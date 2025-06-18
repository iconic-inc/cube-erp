import { deleteEmployee, getEmployeeById } from '~/services/employee.server';
import EmployeeProfileHeader from '../../../../components/EmployeeProfileHeader';
import { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { authenticator, isAuthenticated } from '~/services/auth.server';
import { data, Link, useLoaderData, useNavigate } from '@remix-run/react';
import Defer from '~/components/Defer';
import AdminAttendanceLog from '../../../../components/AttendanceLog';
import { getLast7DaysStats } from '~/services/attendance.server';
import { parseAuthCookie } from '~/services/cookie.server';
import ContentHeader from '~/components/ContentHeader';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  try {
    const user = await parseAuthCookie(request);
    // Fetch employee details from the API
    const employeeId = params.employeeId as string;
    const employee = await getEmployeeById(employeeId, user!);
    const last7DaysStats = getLast7DaysStats(employee.emp_user.id, user!).catch(
      (error) => {
        console.error(error);
        return [];
      },
    );

    return { employee, last7DaysStats };
  } catch (error) {
    console.error(error);
    return { employee: null, last7DaysStats: Promise.resolve([]) };
  }
};
export default function EmployeeDetails() {
  const { employee, last7DaysStats } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <div className='space-y-6'>
      {/* Content Header with Back Button */}
      <ContentHeader
        title='Chi tiết nhân viên'
        actionContent={
          <span>
            <span className='material-symbols-outlined text-sm mr-1'>edit</span>
            Sửa thông tin
          </span>
        }
        actionHandler={() => navigate(`/erp/employees/${employee?.id}/edit`)}
      />

      {/* Employee Profile Header */}
      {employee && <EmployeeProfileHeader employee={employee} />}

      <div className='bg-white rounded-lg shadow-sm overflow-hidden mb-6'>
        <div className='p-6'>
          {/* Recent Attendance Log */}
          <Defer resolve={last7DaysStats}>
            {(data) =>
              data ? <AdminAttendanceLog attendanceStats={data} /> : null
            }
          </Defer>
        </div>
      </div>
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
