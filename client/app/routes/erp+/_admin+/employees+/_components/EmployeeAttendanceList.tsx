import { Link } from '@remix-run/react';
import Defer from '~/components/Defer';
import LoadingCard from '~/components/LoadingCard';
import ErrorCard from '~/components/ErrorCard';
import { IAttendanceBrief } from '~/interfaces/attendance.interface';
import { ILoaderDataPromise } from '~/interfaces/app.interface';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Clock, Calendar, Plus, AlertCircle, CheckCircle } from 'lucide-react';

export default function EmployeeAttendanceList({
  employeeId,
  attendancePromise,
}: {
  employeeId: string;
  attendancePromise: ILoaderDataPromise<IAttendanceBrief[]>;
}) {
  return (
    <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200'>
      <CardHeader className='bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-white text-xl font-bold flex items-center'>
            <Clock className='w-6 h-6 mr-2' />
            Lịch sử chấm công (7 ngày gần nhất)
          </CardTitle>
          <Button
            size='sm'
            variant='secondary'
            className='bg-white/20 hover:bg-white/30 text-white border-white/30'
            asChild
          >
            <Link to={`/erp/attendance/detail?employeeId=${employeeId}`}>
              Xem tất cả
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className='p-0'>
        <Defer resolve={attendancePromise} fallback={<LoadingCard />}>
          {(attendanceList) => {
            if (!attendanceList || 'success' in attendanceList) {
              return (
                <div className='p-6'>
                  <ErrorCard
                    message={
                      attendanceList &&
                      'message' in attendanceList &&
                      typeof attendanceList.message === 'string'
                        ? attendanceList.message
                        : 'Không thể tải dữ liệu chấm công'
                    }
                  />
                </div>
              );
            }

            if (attendanceList.length === 0) {
              return (
                <div className='p-8 text-center'>
                  <Calendar className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                  <h3 className='text-lg font-medium text-gray-900 mb-2'>
                    Chưa có dữ liệu chấm công
                  </h3>
                  <p className='text-gray-500 mb-4'>
                    Nhân viên này chưa có bản ghi chấm công nào trong 7 ngày gần
                    nhất.
                  </p>
                  <Button variant='outline' asChild>
                    <Link
                      to={`/erp/attendance/detail?employeeId=${employeeId}`}
                    >
                      Xem tất cả chấm công
                    </Link>
                  </Button>
                </div>
              );
            }

            return (
              <div className='divide-y divide-gray-200'>
                {attendanceList.map((attendance) => (
                  <div
                    key={attendance.id}
                    className='p-4 hover:bg-gray-50 transition-colors'
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-4'>
                        <div className='flex-shrink-0'>
                          {attendance.checkInTime && attendance.checkOutTime ? (
                            <CheckCircle className='w-5 h-5 text-green-500' />
                          ) : (
                            <AlertCircle className='w-5 h-5 text-yellow-500' />
                          )}
                        </div>

                        <div>
                          <div className='flex items-center space-x-2'>
                            <span className='text-sm font-medium text-gray-900'>
                              {attendance.date
                                ? format(
                                    new Date(attendance.date),
                                    'EEEE, dd/MM/yyyy',
                                    { locale: vi },
                                  )
                                : 'Không có ngày'}
                            </span>
                            <Badge
                              variant={
                                attendance.checkInTime &&
                                attendance.checkOutTime
                                  ? 'default'
                                  : 'secondary'
                              }
                              className='text-xs'
                            >
                              {attendance.checkInTime && attendance.checkOutTime
                                ? 'Hoàn thành'
                                : 'Chưa hoàn thành'}
                            </Badge>
                          </div>

                          <div className='flex items-center space-x-4 mt-1 text-sm text-gray-500'>
                            <span className='flex items-center'>
                              <Clock className='w-3 h-3 mr-1' />
                              Vào:{' '}
                              {attendance.checkInTime
                                ? format(
                                    new Date(attendance.checkInTime),
                                    'HH:mm',
                                    { locale: vi },
                                  )
                                : '--:--'}
                            </span>
                            <span className='flex items-center'>
                              <Clock className='w-3 h-3 mr-1' />
                              Ra:{' '}
                              {attendance.checkOutTime
                                ? format(
                                    new Date(attendance.checkOutTime),
                                    'HH:mm',
                                    { locale: vi },
                                  )
                                : '--:--'}
                            </span>
                            {attendance.checkInTime &&
                              attendance.checkOutTime && (
                                <span className='text-blue-600 font-medium'>
                                  Tổng:{' '}
                                  {calculateWorkHours(
                                    attendance.checkInTime,
                                    attendance.checkOutTime,
                                  )}
                                </span>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {attendanceList.length > 0 && (
                  <div className='p-4 bg-gray-50 text-center'>
                    <Button variant='outline' asChild>
                      <Link
                        to={`/erp/attendance/detail?employeeId=${employeeId}`}
                      >
                        Xem tất cả chấm công
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            );
          }}
        </Defer>
      </CardContent>
    </Card>
  );
}

// Helper function to calculate work hours
function calculateWorkHours(checkIn: string, checkOut: string): string {
  const checkInTime = new Date(checkIn);
  const checkOutTime = new Date(checkOut);
  const diffInMs = checkOutTime.getTime() - checkInTime.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);

  const hours = Math.floor(diffInHours);
  const minutes = Math.floor((diffInHours - hours) * 60);

  return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
}
