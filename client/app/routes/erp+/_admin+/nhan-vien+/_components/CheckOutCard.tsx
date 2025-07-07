import { LoaderCircle } from 'lucide-react';
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
    <div className='w-full md:w-1/2 max-w-xs mt-4 md:mt-0'>
      <div
        className={`bg-orange-50 rounded-lg p-6 md:p-8 text-center border border-orange-100 group
  ${isDisabled ? 'scale-90' : 'scale-110 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 cursor-pointer'} 
  `}
      >
        <div className='w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 transition-all'>
          <span className='material-symbols-outlined text-3xl text-orange-500'>
            logout
          </span>
        </div>
        <h3 className='text-xl font-semibold mb-2'>Kết thúc</h3>
        <p className='text-sm text-gray-500 mb-4'>Kết thúc ngày làm việc</p>

        <Button
          className='w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white'
          disabled={isDisabled}
          type='submit'
          name='type'
          value='check-out'
        >
          {loading && <LoaderCircle className='animate-spin mr-2' />}
          Kết thúc
        </Button>

        {!attendance?.checkInTime && (
          <p className='text-xs text-red-500 mt-4'>
            Không thể kết thúc trước khi vào làm
          </p>
        )}

        {attendance?.checkOutTime && (
          <p className='text-xs text-red-500 mt-4'>
            Đã kết thúc vào lúc{' '}
            {new Date(attendance.checkOutTime).toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
}
