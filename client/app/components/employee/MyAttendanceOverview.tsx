import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import {
  Clock,
  ArrowUpRight,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
} from 'lucide-react';
import { Link } from '@remix-run/react';
import {
  IAttendance,
  IAttendanceBrief,
} from '~/interfaces/attendance.interface';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface MyAttendanceOverviewProps {
  attendanceList: IAttendanceBrief[];
  weeklyAttendanceRate: number;
  todayAttendanceRecord?: IAttendanceBrief;
}

export default function MyAttendanceOverview({
  attendanceList,
  weeklyAttendanceRate,
  todayAttendanceRecord,
}: MyAttendanceOverviewProps) {
  const getAttendanceStatus = (attendance: IAttendanceBrief) => {
    if (attendance.checkInTime && attendance.checkOutTime) {
      return {
        status: 'completed',
        color: 'text-green-600 bg-green-100',
        icon: CheckCircle,
      };
    } else if (attendance.checkInTime) {
      return {
        status: 'in_progress',
        color: 'text-blue-600 bg-blue-100',
        icon: Clock,
      };
    } else {
      return {
        status: 'absent',
        color: 'text-gray-600 bg-gray-100',
        icon: AlertCircle,
      };
    }
  };

  const translateAttendanceStatus = (status: string) => {
    switch (status) {
      case 'completed':
        return 'hoàn thành';
      case 'in_progress':
        return 'đang làm việc';
      case 'absent':
        return 'chưa chấm công';
      default:
        return status;
    }
  };

  const calculateWorkHours = (checkIn: string, checkOut: string): string => {
    const checkInTime = new Date(checkIn);
    const checkOutTime = new Date(checkOut);
    const diffInMs = checkOutTime.getTime() - checkInTime.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    const hours = Math.floor(diffInHours);
    const minutes = Math.floor((diffInHours - hours) * 60);

    return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
  };

  return (
    <Card className='h-full'>
      <CardHeader className='pb-4'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-xl font-bold flex items-center'>
            <User className='w-5 h-5 mr-2 text-red-900' />
            Chấm công của tôi
          </CardTitle>
          <Button variant='ghost' size='sm' asChild>
            <Link to='/erp/nhan-vien/cham-cong' className='flex items-center'>
              Xem tất cả
              <ArrowUpRight className='w-4 h-4 ml-1' />
            </Link>
          </Button>
        </div>

        <div className='flex items-center space-x-4 text-sm text-muted-foreground'>
          <div className='flex items-center space-x-2'>
            <div className='h-3 w-3 rounded-full bg-green-500'></div>
            <span>
              Tuần này: {attendanceList.filter((a) => a.checkInTime).length}/7
              ngày
            </span>
          </div>
          <div className='flex items-center space-x-2'>
            <span className='font-medium'>
              Tỷ lệ: {weeklyAttendanceRate.toFixed(1)}%
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-4 overflow-y-auto'>
        {/* Today's attendance status */}
        {todayAttendanceRecord && (
          <div className='p-3 bg-blue-50 border border-blue-200 rounded-lg'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-3'>
                <CheckCircle className='w-5 h-5 text-blue-600' />
                <div>
                  <p className='font-medium text-blue-900'>Hôm nay</p>
                  <p className='text-sm text-blue-600'>
                    {todayAttendanceRecord.checkInTime &&
                    todayAttendanceRecord.checkOutTime
                      ? 'Đã hoàn thành ca làm việc'
                      : todayAttendanceRecord.checkInTime
                        ? 'Đang làm việc'
                        : 'Chưa chấm công'}
                  </p>
                </div>
              </div>
              <Badge variant='outline' className='text-xs'>
                {todayAttendanceRecord.checkInTime &&
                todayAttendanceRecord.checkOutTime
                  ? calculateWorkHours(
                      todayAttendanceRecord.checkInTime,
                      todayAttendanceRecord.checkOutTime,
                    )
                  : 'Chưa hoàn thành'}
              </Badge>
            </div>
          </div>
        )}

        {attendanceList.length === 0 ? (
          <div className='text-center py-8'>
            <Calendar className='w-12 h-12 text-muted-foreground mx-auto mb-4' />
            <p className='text-muted-foreground'>
              Không có bản ghi chấm công tuần này
            </p>
          </div>
        ) : (
          attendanceList.slice(0, 5).map((attendance) => {
            const {
              status,
              color,
              icon: StatusIcon,
            } = getAttendanceStatus(attendance);

            return (
              <div
                key={attendance.id}
                className='flex items-center space-x-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors'
              >
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center justify-between mb-1'>
                    <span className='text-sm font-medium text-foreground'>
                      {format(new Date(attendance.date), 'EEEE, dd/MM', {
                        locale: vi,
                      })}
                    </span>

                    <div
                      className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}
                    >
                      <StatusIcon className='w-3 h-3' />
                      <span>{translateAttendanceStatus(status)}</span>
                    </div>
                  </div>

                  <div className='flex items-center space-x-4 mt-2 text-xs'>
                    <div className='flex items-center space-x-1'>
                      <Clock className='w-3 h-3 text-green-600' />
                      <span className='text-green-600'>
                        Vào:{' '}
                        {attendance.checkInTime
                          ? format(new Date(attendance.checkInTime), 'HH:mm', {
                              locale: vi,
                            })
                          : '--:--'}
                      </span>
                    </div>

                    <div className='flex items-center space-x-1'>
                      <Clock className='w-3 h-3 text-red-600' />
                      <span className='text-red-600'>
                        Ra:{' '}
                        {attendance.checkOutTime
                          ? format(new Date(attendance.checkOutTime), 'HH:mm', {
                              locale: vi,
                            })
                          : '--:--'}
                      </span>
                    </div>

                    {attendance.checkInTime && attendance.checkOutTime && (
                      <Badge variant='outline' className='text-xs'>
                        {calculateWorkHours(
                          attendance.checkInTime,
                          attendance.checkOutTime,
                        )}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
