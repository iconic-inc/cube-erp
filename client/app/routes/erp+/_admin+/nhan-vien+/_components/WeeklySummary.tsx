import { IAttendance } from '~/interfaces/attendance.interface';

export default function WeeklySummary({
  last7DaysStats,
}: {
  last7DaysStats: IAttendance[];
}) {
  return (
    <div className='bg-white rounded-lg shadow-sm p-4 md:p-6 mb-8'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
        <h2 className='font-semibold text-lg'>Lịch sử 7 ngày gần nhất</h2>
        <div className='flex flex-wrap gap-2 w-full sm:w-auto'>
          {/* <select className='text-xs border border-gray-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition flex-1 sm:flex-none'>
            <option>This Week</option>
            <option>Last Week</option>
            <option>Two Weeks Ago</option>
          </select> */}
          {/* <button className='text-blue-500 hover:text-blue-600 text-xs flex items-center transition-all hover:underline flex-1 sm:flex-none justify-center'>
            Detailed Report
            <span className='material-symbols-outlined text-sm ml-1'>
              chevron_right
            </span>
          </button> */}
        </div>
      </div>

      <div className='overflow-x-auto -mx-4 md:mx-0'>
        <div className='min-w-max px-4 md:px-0'>
          <table className='w-full divide-y divide-gray-200'>
            <thead>
              <tr>
                <th className='px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Date
                </th>
                <th className='px-4 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Clock In
                </th>
                <th className='px-4 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Clock Out
                </th>
                <th className='px-4 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Break Time
                </th>
                <th className='px-4 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Total Hours
                </th>
                <th className='px-4 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Status
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              <tr className='hover:bg-gray-50 transition-all'>
                <td className='px-4 py-3 whitespace-nowrap'>
                  <div className='text-sm font-medium'>Monday, May 13</div>
                </td>
                <td className='px-4 py-3 whitespace-nowrap text-center text-sm'>
                  08:02 AM
                </td>
                <td className='px-4 py-3 whitespace-nowrap text-center text-sm'>
                  05:15 PM
                </td>
                <td className='px-4 py-3 whitespace-nowrap text-center text-sm'>
                  00:45
                </td>
                <td className='px-4 py-3 whitespace-nowrap text-center text-sm font-medium'>
                  8.5
                </td>
                <td className='px-4 py-3 whitespace-nowrap text-center'>
                  <span className='px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800'>
                    Completed
                  </span>
                </td>
              </tr>

              <tr className='hover:bg-gray-50 transition-all'>
                <td className='px-4 py-3 whitespace-nowrap'>
                  <div className='text-sm font-medium'>Tuesday, May 14</div>
                </td>
                <td className='px-4 py-3 whitespace-nowrap text-center text-sm'>
                  08:15 AM
                </td>
                <td className='px-4 py-3 whitespace-nowrap text-center text-sm'>
                  05:30 PM
                </td>
                <td className='px-4 py-3 whitespace-nowrap text-center text-sm'>
                  01:00
                </td>
                <td className='px-4 py-3 whitespace-nowrap text-center text-sm font-medium'>
                  8.25
                </td>
                <td className='px-4 py-3 whitespace-nowrap text-center'>
                  <span className='px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800'>
                    Completed
                  </span>
                </td>
              </tr>

              <tr className='hover:bg-gray-50 transition-all bg-blue-50'>
                <td className='px-4 py-3 whitespace-nowrap'>
                  <div className='text-sm font-medium'>Wednesday, May 15</div>
                  <div className='text-xs text-blue-500'>Today</div>
                </td>
                <td className='px-4 py-3 whitespace-nowrap text-center text-sm'>
                  08:03 AM
                </td>
                <td className='px-4 py-3 whitespace-nowrap text-center text-sm'>
                  --:-- --
                </td>
                <td className='px-4 py-3 whitespace-nowrap text-center text-sm'>
                  00:00
                </td>
                <td className='px-4 py-3 whitespace-nowrap text-center text-sm font-medium'>
                  0.7
                </td>
                <td className='px-4 py-3 whitespace-nowrap text-center'>
                  <span className='px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800'>
                    In Progress
                  </span>
                </td>
              </tr>

              <tr className='hover:bg-gray-50 transition-all text-gray-400'>
                <td className='px-4 py-3 whitespace-nowrap'>
                  <div className='text-sm font-medium'>Thursday, May 16</div>
                </td>
                <td className='px-4 py-3 whitespace-nowrap text-center text-sm'>
                  --:-- --
                </td>
                <td className='px-4 py-3 whitespace-nowrap text-center text-sm'>
                  --:-- --
                </td>
                <td className='px-4 py-3 whitespace-nowrap text-center text-sm'>
                  --:--
                </td>
                <td className='px-4 py-3 whitespace-nowrap text-center text-sm font-medium'>
                  0
                </td>
                <td className='px-4 py-3 whitespace-nowrap text-center'>
                  <span className='px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-600'>
                    Upcoming
                  </span>
                </td>
              </tr>

              <tr className='hover:bg-gray-50 transition-all text-gray-400'>
                <td className='px-4 py-3 whitespace-nowrap'>
                  <div className='text-sm font-medium'>Friday, May 17</div>
                </td>
                <td className='px-4 py-3 whitespace-nowrap text-center text-sm'>
                  --:-- --
                </td>
                <td className='px-4 py-3 whitespace-nowrap text-center text-sm'>
                  --:-- --
                </td>
                <td className='px-4 py-3 whitespace-nowrap text-center text-sm'>
                  --:--
                </td>
                <td className='px-4 py-3 whitespace-nowrap text-center text-sm font-medium'>
                  0
                </td>
                <td className='px-4 py-3 whitespace-nowrap text-center'>
                  <span className='px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-600'>
                    Upcoming
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
