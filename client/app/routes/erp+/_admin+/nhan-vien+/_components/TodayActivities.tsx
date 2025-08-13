import { LogIn, LogOut, Clock } from 'lucide-react';
import { IAttendance } from '~/interfaces/attendance.interface';
import { calHourDiff } from '~/utils';

export default function TodayActivities({
  attendance,
}: {
  attendance: IAttendance;
}) {
  return (
    <div className='mt-6 pt-6 border-t border-gray-100'>
      <div className='flex justify-between mb-4'>
        <h3 className='text-md font-semibold'>Hoạt động hôm nay</h3>
      </div>

      <div className='bg-gray-50 rounded-lg p-4'>
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center'>
            <LogIn className='w-4 h-4 text-green-500 mr-2' />
            <span className='text-sm'>Điểm danh</span>
          </div>

          <div className='text-sm font-medium'>
            {attendance.checkInTime
              ? new Date(attendance.checkInTime).toLocaleTimeString()
              : '--:-- --'}
          </div>
        </div>

        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center'>
            <LogOut className='w-4 h-4 text-orange-500 mr-2' />
            <span className='text-sm'>Kết thúc</span>
          </div>
          <div className='text-sm font-medium'>
            {attendance.checkOutTime
              ? new Date(attendance.checkOutTime).toLocaleTimeString()
              : '--:-- --'}
          </div>
        </div>

        <div className='flex items-center justify-between'>
          <div className='flex items-center'>
            <Clock className='w-4 h-4 text-orange-500 mr-2' />
            <span className='text-sm'>Tổng giờ làm</span>
          </div>
          <div className='text-sm font-medium'>
            {attendance.checkInTime && attendance.checkOutTime
              ? calHourDiff(attendance.checkInTime, attendance.checkOutTime)
              : '--'}{' '}
            giờ
          </div>
        </div>
      </div>
    </div>
  );
}
