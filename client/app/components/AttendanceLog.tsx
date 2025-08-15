import { IAttendanceBrief } from '~/interfaces/attendance.interface';
import { calHourDiff } from '~/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Calendar, Clock, CheckCircle, XCircle, Timer } from 'lucide-react';

export default function AttendanceLog({
  attendanceStats,
}: {
  attendanceStats: IAttendanceBrief[];
}) {
  return (
    <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200'>
      <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white p-3 sm:p-4'>
        <CardTitle className='text-white text-lg sm:text-xl font-bold flex items-center'>
          <Clock className='w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0' />
          <span className='hidden sm:inline'>
            Lịch sử chấm công 7 ngày gần nhất
          </span>
          <span className='sm:hidden'>Lịch sử 7 ngày</span>
        </CardTitle>
      </CardHeader>
      <CardContent className='p-2'>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='text-sm sm:text-base'>
                  <div className='flex items-center space-x-1 sm:space-x-2'>
                    <Calendar className='w-3 h-3 sm:w-4 sm:h-4 text-gray-400' />
                    <span>Ngày</span>
                  </div>
                </TableHead>
                <TableHead className='text-sm sm:text-base'>
                  <div className='flex items-center space-x-1 sm:space-x-2'>
                    <CheckCircle className='w-3 h-3 sm:w-4 sm:h-4 text-green-500' />
                    <span className='hidden sm:inline'>Giờ Vào</span>
                    <span className='sm:hidden'>Vào</span>
                  </div>
                </TableHead>
                <TableHead className='text-sm sm:text-base'>
                  <div className='flex items-center space-x-1 sm:space-x-2'>
                    <XCircle className='w-3 h-3 sm:w-4 sm:h-4 text-red-500' />
                    <span className='hidden sm:inline'>Giờ Ra</span>
                    <span className='sm:hidden'>Ra</span>
                  </div>
                </TableHead>
                <TableHead className='text-sm sm:text-base'>
                  <div className='flex items-center space-x-1 sm:space-x-2'>
                    <Timer className='w-3 h-3 sm:w-4 sm:h-4 text-blue-500' />
                    <span className='hidden sm:inline'>Tổng Giờ Làm</span>
                    <span className='sm:hidden'>Tổng</span>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceStats.map((att) => (
                <TableRow key={att.id} className='hover:bg-gray-50'>
                  <TableCell className='text-sm sm:text-base text-gray-600'>
                    {new Date(att.date).toLocaleDateString('vi-VN')}
                  </TableCell>
                  <TableCell className='text-sm sm:text-base text-gray-900'>
                    {att.checkInTime
                      ? new Date(att.checkInTime).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </TableCell>
                  <TableCell className='text-sm sm:text-base text-gray-900'>
                    {att.checkOutTime
                      ? new Date(att.checkOutTime).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </TableCell>
                  <TableCell className='text-sm sm:text-base text-gray-900 font-medium'>
                    {att.checkInTime && att.checkOutTime
                      ? `${calHourDiff(att.checkInTime, att.checkOutTime)}h`
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
