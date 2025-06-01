import { useFetcher } from '@remix-run/react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

import { IAttendance } from '~/interfaces/attendance.interface';
import { action } from '~/routes/erp+/_admin+/attendance+/$id_';
import TextInput from '~/components/TextInput';
import HRMButton from '~/components/CustomButton';

export default function AttendanceFormPopup({
  attendanceStats: att,
  onClose,
}: {
  attendanceStats: IAttendance;
  onClose: () => void;
}) {
  const fetcher = useFetcher<typeof action>();
  const [loading, setLoading] = useState(false);
  const toastIdRef = useRef<any>(null);

  useEffect(() => {
    switch (fetcher.state) {
      case 'submitting':
        toastIdRef.current = toast.loading('Đang cập nhật...', {
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
          onClose();
          break;
        }

        break;
    }
  }, [fetcher.state]);

  return (
    <div
      className='fixed inset-0 flex items-center justify-center z-50 bg-gray-900 bg-opacity-50'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-lg shadow-lg p-6 w-full max-w-md'
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className='text-lg font-semibold mb-4'>Chấm công cho nhân viên</h2>
        <fetcher.Form
          method='PUT'
          action={`/erp/attendance/${att?.id}`}
          className='space-y-4'
        >
          {/* <input type='hidden' name='employeeId' value={employee.id} /> */}
          <input type='hidden' name='attendanceId' value={att?.id} />
          <div>
            <TextInput
              label='Ngày'
              type='date'
              id='checkInDate'
              name='checkInDate'
              defaultValue={format(
                new Date(att?.date || Date.now()),
                'yyyy-MM-dd',
              )}
              required
            />
          </div>
          <div>
            <TextInput
              label='Giờ vào'
              type='time'
              id='checkInTime'
              name='checkInTime'
              defaultValue={format(
                new Date(att?.checkInTime || Date.now()),
                'HH:mm:ss',
              )}
              required
            />
          </div>
          <div>
            <TextInput
              label='Giờ ra'
              type='time'
              id='checkOutTime'
              name='checkOutTime'
              defaultValue={
                att.checkOutTime &&
                format(new Date(att?.checkOutTime), 'HH:mm:ss')
              }
            />
          </div>
          <div className='flex items-center justify-between mt-4'>
            <HRMButton type='button' onClick={onClose} color='gray'>
              Huỷ
            </HRMButton>

            <HRMButton type='submit' color='blue' disabled={loading}>
              {loading ? 'Đang cập nhật...' : 'Cập nhật'}
            </HRMButton>
          </div>
        </fetcher.Form>
      </div>
    </div>
  );
}
