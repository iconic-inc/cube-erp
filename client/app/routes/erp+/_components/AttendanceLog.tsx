import { useFetcher } from '@remix-run/react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import {
  IAttendance,
  IAttendanceBrief,
} from '~/interfaces/attendance.interface';
import { calHourDiff } from '~/utils';
import { action } from '../_admin+/attendance+/$id_';

export default function AttendanceLog({
  attendanceStats,
}: {
  attendanceStats: IAttendanceBrief[];
}) {
  const fetcher = useFetcher<typeof action>();
  const [loading, setLoading] = useState(false);
  const toastIdRef = useRef<any>(null);

  useEffect(() => {
    switch (fetcher.state) {
      case 'submitting':
        toastIdRef.current = toast.loading('Đang xoá...', {
          autoClose: false,
        });
        setLoading(true);
        break;

      case 'loading':
        if (fetcher.data?.toast && toastIdRef.current) {
          const { toast: toastData } = fetcher.data as any;
          toast.update(toastIdRef.current, {
            render: toastData.message,
            type: toastData.type || 'success', // Default to 'success' if type is not provided
            autoClose: 3000,
            isLoading: false,
          });
          toastIdRef.current = null;
          setLoading(false);

          break;
        }

        break;
    }
  }, [fetcher.state]);

  return (
    <div>
      <div className='flex justify-between items-center mb-4'>
        <h4 className='font-medium text-gray-700'>Lịch sử chấm công</h4>
        {/* <button className='text-sm text-blue-500 hover:text-blue-700 hover:underline'>
          View All
        </button> */}
      </div>

      <div className='overflow-x-auto'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead className='bg-gray-50'>
            <tr>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                Ngày
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                Giờ Vào
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                Giờ Ra
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                Tổng Giờ Làm
              </th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {attendanceStats.map((att) => (
              <tr key={att.id} className='hover:bg-gray-50 transition-all'>
                <td
                  key={att.id}
                  className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'
                >
                  {new Date(att.date).toLocaleDateString()}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                  {att.checkInTime
                    ? new Date(att.checkInTime).toLocaleTimeString()
                    : '-'}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                  {att.checkOutTime
                    ? new Date(att.checkOutTime).toLocaleTimeString()
                    : '-'}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                  {att.checkInTime && att.checkOutTime
                    ? calHourDiff(att.checkInTime, att.checkOutTime)
                    : '-'}{' '}
                  giờ
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
