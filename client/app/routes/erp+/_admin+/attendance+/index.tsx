import { ActionFunctionArgs, LoaderFunctionArgs, data } from '@remix-run/node';
import { useLoaderData, Link } from '@remix-run/react';

import ContentHeader from '~/components/ContentHeader';
import {
  getAttendanceQR,
  getTodayAttendanceStats,
} from '~/services/attendance.server';
import Defer from '~/components/Defer';
import ManageNetwork from '~/components/ManageNetwork';
import ManageQRCode from '~/components/ManageQRCode';
import { getOfficeIPs } from '~/services/officeIP.server';
import EmployeeAttendanceList from '~/components/EmployeeAttendanceList';
import { parseAuthCookie } from '~/services/cookie.server';
import { Button } from '~/components/ui/button';
import { FileText } from 'lucide-react';
import {
  getAttendanceRequests,
  acceptAttendanceRequest,
  rejectAttendanceRequest,
} from '~/services/attendanceRequest.server';
import EmployeeAttendanceRequestList from '~/components/EmployeeAttendanceRequestList';
import { isAuthenticated } from '~/services/auth.server';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await parseAuthCookie(request);
  const qrcode = getAttendanceQR(user!).catch((e) => {
    console.error(e);
    return;
  });
  const officeIPs = getOfficeIPs(user!).catch((e) => {
    console.error(e);
    return [];
  });
  const attendanceStats = getTodayAttendanceStats(user!).catch((e) => {
    console.error(e);
    return [];
  });
  const attendanceRequests = getAttendanceRequests(user!).catch((e) => {
    return { success: false, message: 'Không thể lấy yêu cầu chấm công' };
  });

  return { qrcode, officeIPs, attendanceStats, attendanceRequests };
};

export default function IndexAttendance() {
  const { qrcode, officeIPs, attendanceStats, attendanceRequests } =
    useLoaderData<typeof loader>();

  return (
    <div className='space-y-4 md:space-y-6 min-h-screen'>
      {/* Content Header */}
      <ContentHeader
        title='Chấm công'
        actionContent={
          <Link to='../attendance-requests'>
            <Button variant='outline' className='flex items-center gap-2'>
              <FileText className='h-4 w-4' />
              Quản lý yêu cầu chấm công
            </Button>
          </Link>
        }
      />

      {/* QR Code and Network Management */}
      <div className='grid grid-cols-2 gap-6'>
        <Defer resolve={officeIPs}>
          {(data) => <ManageNetwork officeIps={data} />}
        </Defer>

        <Defer resolve={qrcode}>
          {(data) => <ManageQRCode qrcode={data} />}
        </Defer>

        <Defer resolve={attendanceStats}>
          {(data) => <EmployeeAttendanceList attendanceStats={data} />}
        </Defer>

        <Defer resolve={attendanceRequests}>
          {(data) => (
            <EmployeeAttendanceRequestList attendanceRequests={data} />
          )}
        </Defer>
      </div>
    </div>
  );
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, headers } = await isAuthenticated(request);
  const formData = await request.formData();
  const actionType = formData.get('action') as string;
  const requestId = formData.get('requestId') as string;

  if (!requestId) {
    return data(
      {
        toast: { type: 'error', message: 'Không tìm thấy ID yêu cầu' },
        status: 400,
      },
      { headers },
    );
  }

  switch (request.method) {
    case 'POST':
      try {
        if (actionType === 'accept') {
          await acceptAttendanceRequest(requestId, session!);
          return data(
            {
              toast: {
                type: 'success',
                message: 'Đã chấp nhận yêu cầu chấm công thành công!',
              },
            },
            { headers },
          );
        } else if (actionType === 'reject') {
          await rejectAttendanceRequest(requestId, session!);
          return data(
            {
              toast: {
                type: 'success',
                message: 'Đã từ chối yêu cầu chấm công!',
              },
            },
            { headers },
          );
        } else {
          return data(
            {
              toast: { type: 'error', message: 'Hành động không hợp lệ' },
              status: 400,
            },
            { headers },
          );
        }
      } catch (error: any) {
        console.error('Error processing attendance request:', error);
        return data(
          {
            toast: {
              type: 'error',
              message: error.message || 'Có lỗi xảy ra khi xử lý yêu cầu',
            },
            status: error.status || 500,
          },
          { headers },
        );
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
