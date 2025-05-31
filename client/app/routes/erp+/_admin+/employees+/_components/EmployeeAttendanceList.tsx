import { Link } from '@remix-run/react';
import {
  IAttendance,
  IAttendanceBrief,
} from '~/interfaces/attendance.interface';
import { calHourDiff } from '~/utils';

export default function EmployeeAttendanceList({
  attendanceStats,
}: {
  attendanceStats: IAttendance[];
}) {
  /**
   * checkInTime: "2025-03-31T03:20:49.599Z"
createdAt: "2025-03-31T03:20:49.606Z"
date: "2025-03-30T17:00:00.000Z"
employee: {
employeeCode: "EMP-NDP1"
id: "67dcdd34623855af01f18ddc"
  user: {
    id: "67dcdd34623855af01f18dda"
    usr_firstName: "Phan"
    usr_lastName: "Nguyễn"
  }
fingerprint: "6c1a790ce95e58e41ffd28c300592c58"
geolocation: {latitude: 10.7932941, longitude: 106.7449393}
id: "67ea0a11c0cd6611fad4f57a"
ip: "115.79.197.170"
updatedAt: "2025-03-31T03:20:49.606Z"
   */
  return (
    <div className='col-span-2 bg-white rounded-lg shadow-sm overflow-hidden'>
      <div className='overflow-x-auto'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead className='bg-gray-50'>
            <tr>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                <div className='flex items-center'>
                  <input
                    type='checkbox'
                    className='mr-2 h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500'
                  />
                  Tên nhân sự
                </div>
              </th>

              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                <div className='flex items-center'>Ngày</div>
              </th>

              <th
                scope='col'
                className='px-6 py-3 text-left text-xs f</tbody>ont-medium text-gray-500 uppercase tracking-wider'
              >
                <div className='flex items-center'>Giờ vào</div>
              </th>

              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                Giờ ra
              </th>

              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                Tổng giờ làm
              </th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {attendanceStats.map((stat) => (
              <tr key={stat.id} className='hover:bg-gray-50 transition-all'>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='flex items-center'>
                    <input
                      type='checkbox'
                      className='mr-3 h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500'
                    />

                    <Link
                      to={`/erp/employees/${stat.employee.id}`}
                      className='flex items-center flex-grow text-gray-900 hover:text-red-500'
                    >
                      <div className='flex-shrink-0 h-10 w-10'>
                        <img
                          className='h-10 w-10 rounded-full object-cover'
                          src={
                            stat.employee.emp_user.usr_avatar?.img_url ||
                            '/assets/user-avatar-placeholder.jpg'
                          }
                          alt=''
                        />
                      </div>
                      <div className='ml-4'>
                        <div className='text-sm font-medium'>
                          {stat.employee.emp_user.usr_firstName}{' '}
                          {stat.employee.emp_user.usr_lastName}
                        </div>
                        <div className='text-sm text-gray-500'>
                          {stat.employee.emp_code}
                        </div>
                      </div>
                    </Link>
                  </div>
                </td>

                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                  {new Date(stat.date).toLocaleDateString()}
                </td>

                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                  {stat.checkInTime
                    ? new Date(stat.checkInTime).toLocaleTimeString()
                    : '-'}
                </td>

                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                  {stat.checkOutTime
                    ? new Date(stat.checkOutTime).toLocaleTimeString()
                    : '-'}
                </td>

                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                  {stat.checkInTime && stat.checkOutTime
                    ? calHourDiff(stat.checkInTime, stat.checkOutTime)
                    : '-'}{' '}
                  giờ
                </td>
              </tr>
            ))}
            {attendanceStats.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className='px-6 py-4 text-center text-sm text-gray-500'
                >
                  Chưa có dữ liệu chấm công
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
