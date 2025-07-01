import { ActionFunctionArgs, data, LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import ContentHeader from '~/components/ContentHeader';
import { isAuthenticated } from '~/services/auth.server';
import {
  checkIn,
  checkOut,
  getLast7DaysStats,
  getLast7DaysStatsForEmployee,
  getTodayAttendanceForEmployee,
} from '~/services/attendance.server';
import Defer from '~/components/Defer';
import AttendanceLog from '~/components/AttendanceLog';
import { parseAuthCookie } from '~/services/cookie.server';
import { getClientIPAddress } from 'remix-utils/get-client-ip-address';
import CheckInOutSection from './_components/CheckInOutSection';

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, headers } = await isAuthenticated(request);
  let ipAddress = getClientIPAddress(request);
  // console.log(ipAddress);
  if (['production'].includes(process.env.NODE_ENV as string)) {
    if (!ipAddress) {
      return data(
        {
          toast: { type: 'error', message: 'Không tìm thấy địa chỉ IP' },
          status: 400,
        },
        { headers },
      );
    }
  } else {
    // For development, use a default IP address
    ipAddress = '127.0.0.1';
  }

  switch (request.method) {
    case 'POST': {
      const body = await request.formData();
      const type = body.get('type') || 'check-in';
      const fingerprint = (body.get('fingerprint') as string) || '';
      const longitude = parseFloat(body.get('longitude') as string) || 106;
      const latitude = parseFloat(body.get('latitude') as string) || 10;

      if (!ipAddress) {
        return data(
          {
            toast: { type: 'error', message: 'Không tìm thấy địa chỉ IP' },
            status: 404,
          },
          { headers },
        );
      }

      const attendanceData = {
        fingerprint,
        ip: ipAddress || '1.1.1.1',
        geolocation: { longitude, latitude },
        userId: session?.user.id,
      };

      try {
        if (type === 'check-in') {
          await checkIn(attendanceData, session!);
        } else if (type === 'check-out') {
          await checkOut(attendanceData, session!);
        }

        return data(
          {
            toast: {
              type: 'success',
              message:
                type === 'check-in'
                  ? 'Điểm danh thành công!'
                  : 'Kết thúc ca làm việc thành công!',
            },
          },
          { headers },
        );
      } catch (error: any) {
        console.error(error);
        return data(
          {
            toast: {
              type: 'error',
              message: error.message || error.statusText,
            },
            status: error.status || 500,
          },
          { headers },
        );
      }
    }

    default:
      return data(
        {
          toast: { type: 'error', message: 'Method not allowed' },
          status: 405,
        },
        { headers },
      );
  }
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await parseAuthCookie(request);

  const todayAttendance = getTodayAttendanceForEmployee(user!).catch((e) => {
    console.error('Error fetching today attendance:', e);
    return {
      success: false,
      message: (e.message as string) || 'Có lỗi khi lấy dữ liệu',
    };
  });
  const attendanceStats = getLast7DaysStatsForEmployee(user!).catch((e) => {
    console.error('Error fetching attendance stats:', e);
    return {
      success: false,
      message: (e.message as string) || 'Có lỗi khi lấy dữ liệu',
    };
  });

  return { attendanceStats, todayAttendance };
};

export default function EmployeeAttendance() {
  const { attendanceStats, todayAttendance } = useLoaderData<typeof loader>();

  return (
    <div className='space-y-8'>
      {/* Content Header */}
      <ContentHeader title='Chấm công' />

      {/* Check-in/Check-out Section and Attendance Stats */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Check-in/Check-out Form */}
        <CheckInOutSection todayAttendance={todayAttendance} />

        {/* Attendance Statistics */}
        <Defer resolve={attendanceStats}>
          {(data) => <AttendanceLog attendanceStats={data} />}
        </Defer>
      </div>
    </div>
  );
}
