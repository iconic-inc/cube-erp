import { LoaderCircle, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '~/components/ui/button';
import { IAttendanceBrief } from '~/interfaces/attendance.interface';

export default function CheckOutCard({
  attendance,
  loading,
}: {
  attendance?: IAttendanceBrief | null;
  loading: boolean;
}) {
  // check out is disabled if it's loading or haven't checked in yet
  const [isDisabled, setIsDisabled] = useState(false);

  useEffect(() => {
    if (loading || !attendance?.checkInTime || attendance.checkOutTime) {
      setIsDisabled(true);
    } else {
      setIsDisabled(false);
    }
  }, [loading, attendance?.checkInTime, attendance?.checkOutTime]);

  return (
    <div className='w-full sm:w-1/2 max-w-xs mx-auto mt-4 sm:mt-0'>
      <div
        className={`bg-orange-50 rounded-lg p-4 sm:p-6 md:p-8 text-center border border-orange-100 group transition-all duration-300
  ${isDisabled ? 'scale-90 opacity-75' : 'scale-100 sm:scale-110 hover:shadow-md transform hover:-translate-y-1 cursor-pointer'} 
  `}
      >
        <div className='w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-orange-200 transition-all'>
          <LogOut className='w-6 h-6 sm:w-8 sm:h-8 text-orange-500' />
        </div>
        <h3 className='text-lg sm:text-xl font-semibold mb-2'>
          <span className='sm:inline'>Kết thúc</span>
        </h3>
        <p className='text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4'>
          <span className='sm:inline'>Kết thúc ngày làm việc</span>
        </p>

        <Button
          className='w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm sm:text-base'
          disabled={isDisabled}
          type='submit'
          name='type'
          value='check-out'
        >
          {loading && <LoaderCircle className='animate-spin mr-2 w-4 h-4' />}
          <span className='sm:inline'>Kết thúc</span>
        </Button>

        {!attendance?.checkInTime && (
          <p className='text-xs text-red-500 mt-3 sm:mt-4'>
            <span className='hidden sm:inline'>
              Không thể kết thúc trước khi vào làm
            </span>
            <span className='sm:hidden'>Chưa vào làm</span>
          </p>
        )}

        {attendance?.checkOutTime && (
          <p className='text-xs text-red-500 mt-3 sm:mt-4'>
            <span className='hidden sm:inline'>
              Đã kết thúc vào lúc{' '}
              {new Date(attendance.checkOutTime).toLocaleTimeString()}
            </span>
            <span className='sm:hidden'>
              Đã ra:{' '}
              {new Date(attendance.checkOutTime).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
