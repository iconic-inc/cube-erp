import { LoaderCircle } from 'lucide-react';
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
    <div className='w-full md:w-1/2 max-w-xs'>
      <div
        className={`bg-green-50 rounded-lg p-6 md:p-8 text-center border border-green-100 group
  ${isDisabled ? 'scale-90' : 'scale-110 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 cursor-pointer'} 
  `}
      >
        <div className='w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-all'>
          <span className='material-symbols-outlined text-3xl text-green-500'>
            login
          </span>
        </div>

        <h3 className='text-xl font-semibold mb-2'>Điểm danh</h3>

        <p className='text-sm text-gray-500 mb-4'>Bắt đầu ngày làm việc</p>

        <Button
          className='w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white'
          disabled={isDisabled}
          type='submit'
          name='type'
          value='check-in'
        >
          {loading && <LoaderCircle className='animate-spin mr-2' />}
          Điểm danh
        </Button>

        {attendance?.checkInTime && (
          <p className='text-xs text-red-500 mt-4'>
            Đã điểm danh vào làm lúc{' '}
            {new Date(attendance.checkInTime).toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
}
