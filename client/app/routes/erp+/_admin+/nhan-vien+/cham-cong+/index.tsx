import { ActionFunctionArgs, data, LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import ContentHeader from '~/components/ContentHeader';
import { isAuthenticated } from '~/services/auth.server';
import {
  checkIn,
  checkOut,
  getLast7DaysStatsForEmployee,
  getTodayAttendanceForEmployee,
} from '~/services/attendance.server';
import {
  createAttendanceRequest,
  getMyAttendanceRequests,
} from '~/services/attendanceRequest.server';
import { getOfficeIPs } from '~/services/officeIP.server';
import Defer from '~/components/Defer';
import AttendanceLog from '~/components/AttendanceLog';
import { parseAuthCookie } from '~/services/cookie.server';
import { getClientIPAddress } from 'remix-utils/get-client-ip-address';
import CheckInOutSection from './_components/CheckInOutSection';
import MyAttendanceRequestList from './_components/MyAttendanceRequestList';

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, headers } = await isAuthenticated(request);
  let ipAddress = getClientIPAddress(request);

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
      const action = body.get('action') as string;

      // Handle attendance request creation
      if (action === 'create-attendance-request') {
        const fingerprint = (body.get('fingerprint') as string) || '';
        const message = body.get('message') as string;
        const type = body.get('type') as string;

        if (!message?.trim()) {
          return data(
            {
              toast: {
                type: 'error',
                message: 'Vui lòng nhập lý do yêu cầu chấm công',
              },
              status: 400,
            },
            { headers },
          );
        }

        try {
          await createAttendanceRequest(
            {
              fingerprint,
              ip: ipAddress!,
              date: new Date().toISOString().split('T')[0],
              message: message.trim(),
              checkInTime:
                type === 'check-in' ? new Date().toISOString() : undefined,
              checkOutTime:
                type === 'check-out' ? new Date().toISOString() : undefined,
            },
            session!,
          );

          return data(
            {
              toast: {
                type: 'success',
                message: 'Yêu cầu chấm công đã được gửi thành công!',
              },
            },
            { headers },
          );
        } catch (error: any) {
          return data(
            {
              toast: {
                type: 'error',
                message: error.message || 'Có lỗi xảy ra khi gửi yêu cầu!',
              },
            },
            { headers },
          );
        }
      }

      // Handle regular check-in/check-out
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

      // Check if IP is in allowed list
      try {
        const officeIPs = await getOfficeIPs(session!);
        const allowedIPs = officeIPs.map((ip) => ip.ipAddress);

        if (!allowedIPs.includes(ipAddress)) {
          return data(
            {
              ipNotAllowed: true,
              type,
              fingerprint,
              ipAddress,
              toast: {
                type: 'warning',
                message:
                  'IP không được phép. Bạn có muốn tạo yêu cầu chấm công?',
              },
            },
            { headers },
          );
        }
      } catch (error) {
        console.error('Error checking office IPs:', error);
        // Continue with regular flow if IP check fails
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
  const attendanceRequests = getMyAttendanceRequests(user!).catch((e) => {
    console.error('Error fetching attendance requests:', e);
    return {
      success: false,
      message: (e.message as string) || 'Có lỗi khi lấy dữ liệu',
    };
  });

  return { attendanceStats, todayAttendance, attendanceRequests };
};

export default function EmployeeAttendance() {
  const { attendanceStats, todayAttendance, attendanceRequests } =
    useLoaderData<typeof loader>();

  return (
    <div className='space-y-4 sm:space-y-6 min-h-screen'>
      {/* Content Header */}
      <ContentHeader title='Chấm công' />

      {/* Check-in/Check-out Section and Attendance Stats */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
        {/* Check-in/Check-out Form */}
        <div className='lg:col-span-1'>
          <CheckInOutSection todayAttendance={todayAttendance} />
        </div>

        {/* Attendance Statistics */}
        <div className='lg:col-span-1'>
          <Defer resolve={attendanceStats}>
            {(data) => <AttendanceLog attendanceStats={data} />}
          </Defer>
        </div>

        {/* Attendance Requests - Full width on mobile, spans 2 columns on desktop */}
        <div className='lg:col-span-2'>
          <Defer resolve={attendanceRequests}>
            {(data) => <MyAttendanceRequestList attendanceRequests={data} />}
          </Defer>
        </div>
      </div>
    </div>
  );
}
