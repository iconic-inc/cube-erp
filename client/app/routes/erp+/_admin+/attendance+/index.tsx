import { ActionFunctionArgs, data, LoaderFunctionArgs } from '@remix-run/node';
import ContentHeader from '../../../../components/ContentHeader';
import { authenticator, isAuthenticated } from '~/services/auth.server';
import {
  getAttendanceQR,
  getAttendanceStats,
  getTodayAttendanceStats,
} from '~/services/attendance.server';
import Defer from '~/components/Defer';
import { useLoaderData } from '@remix-run/react';
import ManageNetwork from '../../../../components/ManageNetwork';
import ManageQRCode from '../../../../components/ManageQRCode';
import { createOfficeIP, getOfficeIPs } from '~/services/officeIP.server';
import EmployeeAttendanceList from '../../../../components/EmployeeAttendanceList';
import { parseAuthCookie } from '~/services/cookie.server';

export const action = async ({ request }: ActionFunctionArgs) => {
  switch (request.method) {
    case 'POST':
      const formData = await request.formData();
      console.log(formData);
      const officeName = formData.get('officeName') as string;
      const ipAddress = formData.get('ipAddress') as string;
      try {
        const { session, headers } = await isAuthenticated(request);

        const officeIP = await createOfficeIP(
          { officeName, ipAddress },
          session!,
        );
        return data(
          {
            toast: { message: 'Thêm địa chỉ IP thành công', type: 'success' },
            officeIP,
          },
          { headers },
        );
      } catch (error: any) {
        return {
          toast: { message: error.message || error.statusText, type: 'error' },
        };
      }

    default:
      return {
        toast: { message: 'Không hỗ trợ phương thức này', type: 'error' },
      };
  }
};

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
    <>
      {/* Content Header */}
      <ContentHeader title='Chấm công' />

      {/* QR Code and Network Management */}
      <div className='grid grid-cols-2 gap-6 mb-4'>
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
    </>
  );
}
