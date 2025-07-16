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
      <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white py-3 sm:py-4'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-white text-lg sm:text-xl font-bold flex items-center'>
            <Clock className='w-5 h-5 sm:w-6 sm:h-6 mr-2' />
            <span className='hidden sm:inline'>
              Lịch sử chấm công (7 ngày gần nhất)
            </span>
            <span className='sm:hidden'>Chấm công (7 ngày)</span>
          </CardTitle>
          <Button
            size='sm'
            variant='secondary'
            className='bg-white/20 hover:bg-white/30 text-white border-white/30 text-xs sm:text-sm'
            asChild
          >
            <Link to={`/erp/attendance/detail?employeeId=${employeeId}`}>
              <span className='hidden sm:inline'>Xem tất cả</span>
              <span className='sm:hidden'>Xem tất cả</span>
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className='p-0'>
        <Defer resolve={attendancePromise} fallback={<LoadingCard />}>
          {(attendanceList) => {
            if (!attendanceList || 'success' in attendanceList) {
              return (
                <div className='p-4 sm:p-6'>
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
                <div className='p-6 sm:p-8 text-center'>
                  <Calendar className='w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4' />
                  <h3 className='text-base sm:text-lg font-medium text-gray-900 mb-2'>
                    Chưa có dữ liệu chấm công
                  </h3>
                  <p className='text-gray-500 mb-4 text-sm'>
                    Nhân viên này chưa có bản ghi chấm công nào trong 7 ngày gần
                    nhất.
                  </p>
                  <Button variant='outline' size='sm' asChild>
                    <Link
                      to={`/erp/attendance/detail?employeeId=${employeeId}`}
                    >
                      <span className='hidden sm:inline'>
                        Xem tất cả chấm công
                      </span>
                      <span className='sm:hidden'>Xem tất cả</span>
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
                    className='p-3 sm:p-4 hover:bg-gray-50 transition-colors'
                  >
                    <div className='flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0'>
                      <div className='flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1'>
                        <div className='flex-shrink-0 mt-1 sm:mt-0'>
                          {attendance.checkInTime && attendance.checkOutTime ? (
                            <CheckCircle className='w-4 h-4 sm:w-5 sm:h-5 text-green-500' />
                          ) : (
                            <AlertCircle className='w-4 h-4 sm:w-5 sm:h-5 text-yellow-500' />
                          )}
                        </div>

                        <div className='flex-1 min-w-0'>
                          <div className='flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2'>
                            <span className='text-sm font-medium text-gray-900 truncate'>
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
                              className='text-xs w-fit'
                            >
                              {attendance.checkInTime && attendance.checkOutTime
                                ? 'Hoàn thành'
                                : 'Chưa hoàn thành'}
                            </Badge>
                          </div>

                          <div className='grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mt-2 sm:mt-1 text-xs sm:text-sm text-gray-500'>
                            <div className='flex items-center'>
                              <Clock className='w-3 h-3 mr-1 flex-shrink-0' />
                              <span className='truncate'>
                                Vào:{' '}
                                {attendance.checkInTime
                                  ? format(
                                      new Date(attendance.checkInTime),
                                      'HH:mm',
                                      { locale: vi },
                                    )
                                  : '--:--'}
                              </span>
                            </div>
                            <div className='flex items-center'>
                              <Clock className='w-3 h-3 mr-1 flex-shrink-0' />
                              <span className='truncate'>
                                Ra:{' '}
                                {attendance.checkOutTime
                                  ? format(
                                      new Date(attendance.checkOutTime),
                                      'HH:mm',
                                      { locale: vi },
                                    )
                                  : '--:--'}
                              </span>
                            </div>
                            {attendance.checkInTime &&
                              attendance.checkOutTime && (
                                <div className='text-blue-600 font-medium'>
                                  Tổng:{' '}
                                  {calculateWorkHours(
                                    attendance.checkInTime,
                                    attendance.checkOutTime,
                                  )}
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {attendanceList.length > 0 && (
                  <div className='p-3 sm:p-4 bg-gray-50 text-center'>
                    <Button variant='outline' size='sm' asChild>
                      <Link
                        to={`/erp/attendance/detail?employeeId=${employeeId}`}
                      >
                        <span className='hidden sm:inline'>
                          Xem tất cả chấm công
                        </span>
                        <span className='sm:hidden'>Xem tất cả</span>
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
