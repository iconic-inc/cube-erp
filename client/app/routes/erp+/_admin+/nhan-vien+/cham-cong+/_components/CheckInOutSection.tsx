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

export default function CheckInOutSection({
  todayAttendance,
}: {
  todayAttendance: ILoaderDataPromise<IAttendanceBrief>;
}) {
  const [fingerprint, setFingerprint] = useState('');
  const [attendance, setAttendance] = useState<IAttendanceBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const fetcher = useFetcher();
  const toastIdRef = useRef<any>(null);

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

  useEffect(() => {
    switch (fetcher.state) {
      case 'submitting':
        toastIdRef.current = toast.loading('Đang xử lý...', {
          autoClose: false,
        });
        setLoading(true);
        break;

      case 'idle':
        if (
          fetcher.data &&
          typeof fetcher.data === 'object' &&
          'toast' in fetcher.data &&
          toastIdRef.current
        ) {
          const { toast: toastData } = fetcher.data as any;
          toast.update(toastIdRef.current, {
            render: toastData.message,
            type: toastData.type || 'success',
            autoClose: 3000,
            isLoading: false,
          });
          toastIdRef.current = null;
          setLoading(false);
        } else if (toastIdRef.current) {
          toast.dismiss(toastIdRef.current);
          toastIdRef.current = null;
          setLoading(false);
        }
        break;
    }
  }, [fetcher.state]);

  return (
    <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200'>
      <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white py-6'>
        <div className='flex items-center space-x-4'>
          <div className='w-16 h-16 bg-white/20 rounded-full flex items-center justify-center'>
            <Clock className='w-8 h-8 text-white' />
          </div>
          <div className='flex-1'>
            <CardTitle className='text-white text-2xl font-bold'>
              Chấm công hôm nay
            </CardTitle>
            <p className='text-green-100 text-sm mt-1'>
              {new Date().toLocaleDateString('vi', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <Timer />
        </div>
      </CardHeader>

      <CardContent className='p-6'>
        <fetcher.Form
          method='POST'
          className='flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6'
        >
          {/* Check-in and Check-out cards will get today's attendance data */}
          <CheckInCard attendance={attendance} loading={loading} />
          <CheckOutCard attendance={attendance} loading={loading} />

          <input type='hidden' name='fingerprint' value={fingerprint} />
        </fetcher.Form>
      </CardContent>
    </Card>
  );
}
