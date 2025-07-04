import { ActionFunctionArgs, data, LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import ContentHeader from '~/components/ContentHeader';
import { isAuthenticated } from '~/services/auth.server';
import {
  getAttendanceQR,
  getTodayAttendanceStats,
} from '~/services/attendance.server';
import Defer from '~/components/Defer';
import ManageNetwork from '~/components/ManageNetwork';
import ManageQRCode from '~/components/ManageQRCode';
import { createOfficeIP, getOfficeIPs } from '~/services/officeIP.server';
import EmployeeAttendanceList from '~/components/EmployeeAttendanceList';
import { parseAuthCookie } from '~/services/cookie.server';

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

  return { qrcode, officeIPs, attendanceStats };
};

export default function IndexAttendance() {
  const { qrcode, officeIPs, attendanceStats } = useLoaderData<typeof loader>();

  return (
    <div className='space-y-4 md:space-y-6 min-h-screen'>
      {/* Content Header */}
      <ContentHeader title='Chấm công' />

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
      </div>
    </div>
  );
}
