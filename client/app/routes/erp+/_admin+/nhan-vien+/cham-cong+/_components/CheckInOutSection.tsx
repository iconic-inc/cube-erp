import { useEffect, useRef, useState } from 'react';
import { useFetcher } from '@remix-run/react';
import { toast } from 'react-toastify';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import Timer from '../../_components/Timer';
import CheckInCard from '../../_components/CheckInCard';
import CheckOutCard from '../../_components/CheckOutCard';
import { Clock } from 'lucide-react';
import { ILoaderDataPromise } from '~/interfaces/app.interface';
import { IAttendanceBrief } from '~/interfaces/attendance.interface';
import { isResolveError } from '~/lib';
import AttendanceRequestDialog from './AttendanceRequestDialog';
import { action } from '..';
import { useFetcherResponseHandler } from '~/hooks/useFetcherResponseHandler';

export default function CheckInOutSection({
  todayAttendance,
}: {
  todayAttendance: ILoaderDataPromise<IAttendanceBrief>;
}) {
  const [fingerprint, setFingerprint] = useState('');
  const [attendance, setAttendance] = useState<IAttendanceBrief | null>(null);
  const fetcher = useFetcher<typeof action>();
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [type, setType] = useState<'check-in' | 'check-out' | null>(null);

  const handleCreateRequest = (message: string) => {
    if (!type) return;

    const formData = new FormData();
    formData.append('action', 'create-attendance-request');
    formData.append('type', type);
    formData.append('fingerprint', fingerprint);
    formData.append('message', message.trim());

    fetcher.submit(formData, { method: 'post' });
    setShowRequestDialog(false);
    setType(null);
  };

  const handleCloseDialog = () => {
    setShowRequestDialog(false);
    setType(null);
  };

  useEffect(() => {
    // Initialize fingerprint
    const fpPromise = import('@fingerprintjs/fingerprintjs').then(
      (FingerprintJS) => FingerprintJS.load(),
    );

    fpPromise
      .then((fp) => fp.get())
      .then((result) => {
        setFingerprint(result.visitorId);
      });
  }, []);

  useEffect(() => {
    async function loadAttendance() {
      const attendance = await todayAttendance;
      if (attendance && !isResolveError(attendance)) {
        setAttendance(attendance);
      } else {
        setAttendance(null);
      }
    }
    loadAttendance();
  }, [todayAttendance]);

  const { isSubmitting } = useFetcherResponseHandler(fetcher, {
    onFailed(data) {
      if (data?.ipNotAllowed) {
        setType(data?.type === 'check-in' ? 'check-in' : 'check-out');
        setShowRequestDialog(true);
      }
    },
  });

  return (
    <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200'>
      <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white p-3 sm:p-6'>
        <div className='flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4'>
          <div className='w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0'>
            <Clock className='w-6 h-6 sm:w-8 sm:h-8 text-white' />
          </div>
          <div className='flex-1 text-center sm:text-left'>
            <CardTitle className='text-white text-lg sm:text-2xl font-bold'>
              <span className='hidden sm:inline'>Chấm công hôm nay</span>
              <span className='sm:hidden'>Chấm công</span>
            </CardTitle>
            <p className='text-green-100 text-sm sm:text-base mt-1'>
              {new Date().toLocaleDateString('vi', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className='flex-shrink-0'>
            <Timer />
          </div>
        </div>
      </CardHeader>

      <CardContent className='p-3 sm:p-6'>
        <fetcher.Form
          method='POST'
          className='flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6'
        >
          {/* Check-in and Check-out cards will get today's attendance data */}
          <CheckInCard attendance={attendance} loading={isSubmitting} />
          <CheckOutCard attendance={attendance} loading={isSubmitting} />

          <input type='hidden' name='fingerprint' value={fingerprint} />
        </fetcher.Form>
      </CardContent>

      {/* Attendance Request Dialog */}
      <AttendanceRequestDialog
        isOpen={showRequestDialog}
        onClose={handleCloseDialog}
        onConfirm={handleCreateRequest}
      />
    </Card>
  );
}
