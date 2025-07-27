import { LoaderCircle, LogIn } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '~/components/ui/button';
import { IAttendanceBrief } from '~/interfaces/attendance.interface';

export default function CheckInCard({
  attendance,
  loading,
}: {
  attendance?: IAttendanceBrief | null;
  loading: boolean;
}) {
  // check in is disabled if it's loading or have checked in
  const [isDisabled, setIsDisabled] = useState(false);

  useEffect(() => {
    if (loading || attendance?.checkInTime) {
      setIsDisabled(true);
    } else {
      setIsDisabled(false);
    }
  }, [loading, attendance?.checkInTime]);

  return (
    <div className='w-full sm:w-1/2 max-w-xs mx-auto'>
      <div
        className={`bg-green-50 rounded-lg p-4 sm:p-6 md:p-8 text-center border border-green-100 group transition-all duration-300
  ${isDisabled ? 'scale-90 opacity-75' : 'scale-100 sm:scale-110 hover:shadow-md transform hover:-translate-y-1 cursor-pointer'} 
  `}
      >
        <div className='w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-green-200 transition-all'>
          <LogIn className='w-6 h-6 sm:w-8 sm:h-8 text-green-500' />
        </div>

        <h3 className='text-lg sm:text-xl font-semibold mb-2'>
          <span className='sm:inline'>Điểm danh</span>
        </h3>

        <p className='text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4'>
          <span className='sm:inline'>Bắt đầu ngày làm việc</span>
        </p>

        <Button
          className='w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white text-sm sm:text-base'
          disabled={isDisabled}
          type='submit'
          name='type'
          value='check-in'
        >
          {loading && <LoaderCircle className='animate-spin mr-2 w-4 h-4' />}
          <span className='sm:inline'>Điểm danh</span>
        </Button>

        {attendance?.checkInTime && (
          <p className='text-xs text-red-500 mt-3 sm:mt-4'>
            <span className='sm:inline'>
              Đã điểm danh vào làm lúc{' '}
              {new Date(attendance.checkInTime).toLocaleTimeString()}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
