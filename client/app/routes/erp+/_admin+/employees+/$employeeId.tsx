import { deleteEmployee, getEmployeeById } from '~/services/employee.server';
import { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { isAuthenticated } from '~/services/auth.server';
import { data, useLoaderData, useNavigate } from '@remix-run/react';
import { getLast7DaysStats } from '~/services/attendance.server';
import {
  getUnauthorizedActionResponse,
  parseAuthCookie,
} from '~/services/cookie.server';
import ContentHeader from '~/components/ContentHeader';
import EmployeeDetail from './_components/EmployeeDetail';
import EmployeeAttendanceList from './_components/EmployeeAttendanceList';
import { Edit, Pen } from 'lucide-react';
import { canAccessEmployeeManagement } from '~/utils/permission';
import { IActionFunctionReturn } from '~/interfaces/app.interface';
import { getTasks } from '~/services/task.server';
import EmployeeTaskList from './_components/EmployeeTaskList';
import { getFirstWeekDate } from '~/utils/date.util';
import { TODAY } from '~/constants/date.constant';

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
      return getLast7DaysStats(employee.emp_user.id, session!).catch((e) => {
        console.error('Error fetching attendance stats:', e);
        return {
          success: false,
          message: e.message || 'Có lỗi khi lấy thống kê chấm công',
        };
      });
    })
    .catch((error) => {
      console.error('Error fetching attendance stats:', error);
      return {
        success: false,
        message: error.message || 'Có lỗi khi lấy thống kê chấm công',
      };
    });

  const taskPromise = getTasks(
    new URLSearchParams({
      assignee: employeeId,
      startDateFrom: getFirstWeekDate(
        TODAY.getDay(),
        TODAY.getMonth(),
        TODAY.getFullYear(),
      ).toISOString(),
    }),
    session!,
  ).catch((error) => {
    console.error('Error fetching tasks:', error);
    return {
      success: false,
      message: error.message || 'Có lỗi khi lấy danh sách công việc',
    };
  });

  return {
    employeeId,
    employeePromise,
    attendancePromise,
    taskPromise,
  };
};
export default function EmployeeDetails() {
  const { employeeId, employeePromise, attendancePromise, taskPromise } =
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

      {/* Employee task List Card */}
      <EmployeeTaskList employeeId={employeeId} taskPromise={taskPromise} />
    </div>
  );
}

export const action = async ({
  request,
  params,
}: ActionFunctionArgs): IActionFunctionReturn => {
  const { session, headers } = await isAuthenticated(request);
  if (!session) return getUnauthorizedActionResponse(data, headers);

  switch (request.method) {
    case 'DELETE':
      await deleteEmployee(params.employeeId!, session!);
      return data(
        {
          success: true,
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
          success: false,
          toast: {
            type: 'error' as const,
            message: 'Phương thức không hợp lệ',
          },
        },
        { headers, status: 405, statusText: 'Method Not Allowed' },
      );
  }
};
