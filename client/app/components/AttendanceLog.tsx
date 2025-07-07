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

export default function AttendanceLog({
  attendanceStats,
}: {
  attendanceStats: IAttendanceBrief[];
}) {
  return (
    <div>
      <div className='flex justify-between items-center mb-4'>
        <h4 className='font-medium text-gray-700'>
          Lịch sử chấm công 7 ngày gần nhất
        </h4>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ngày</TableHead>
            <TableHead>Giờ Vào</TableHead>
            <TableHead>Giờ Ra</TableHead>
            <TableHead>Tổng Giờ Làm</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attendanceStats.map((att) => (
            <TableRow key={att.id}>
              <TableCell>{new Date(att.date).toLocaleDateString()}</TableCell>
              <TableCell>
                {att.checkInTime
                  ? new Date(att.checkInTime).toLocaleTimeString()
                  : '-'}
              </TableCell>
              <TableCell>
                {att.checkOutTime
                  ? new Date(att.checkOutTime).toLocaleTimeString()
                  : '-'}
              </TableCell>
              <TableCell>
                {att.checkInTime && att.checkOutTime
                  ? `${calHourDiff(att.checkInTime, att.checkOutTime)} giờ`
                  : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
