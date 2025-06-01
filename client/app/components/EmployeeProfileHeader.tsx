import { useOutletContext } from '@remix-run/react';
import { IEmployee } from '~/interfaces/employee.interface';
import { toVnDateString } from '~/utils';

export default function EmployeeProfileHeader({
  employee,
}: {
  employee: IEmployee;
}) {
  return (
    <div className='bg-white rounded-lg shadow-sm p-6 mb-6'>
      <div className='flex flex-col md:flex-row gap-6 items-start md:items-center'>
        <div className='relative'>
          <img
            src={
              employee.emp_user.usr_avatar?.img_url ||
              '/assets/user-avatar-placeholder.jpg'
            }
            alt={employee.emp_user.usr_firstName}
            className='w-24 h-24 rounded-full object-cover border-4 border-white shadow-md'
          />
          {/* <div className='absolute bottom-0 right-0 bg-green-500 h-4 w-4 rounded-full border-2 border-white'></div> */}
        </div>

        <div className='flex-1'>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between mb-2'>
            <h2 className='text-2xl font-bold mb-1 sm:mb-0'>{`${employee.emp_user.usr_lastName} ${employee.emp_user.usr_firstName}`}</h2>
            <span className='px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-semibold inline-flex items-center'>
              {employee.emp_position}
            </span>
          </div>

          <div className='text-gray-500 mb-4'>
            {`${employee.emp_department} · ${employee.emp_code}`}
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-2'>
            <div className='flex items-center text-gray-600'>
              <span className='material-symbols-outlined text-gray-400 mr-2'>
                mail
              </span>
              <a
                href={`mailto:${employee.emp_user.usr_email}`}
                className='text-sm hover:underline'
              >
                {employee.emp_user.usr_email}
              </a>
            </div>

            <div className='flex items-center text-gray-600'>
              <span className='material-symbols-outlined text-gray-400 mr-2'>
                phone
              </span>
              <a
                href={`tel:${employee.emp_user.usr_msisdn}`}
                className='text-sm hover:underline'
              >
                {employee.emp_user.usr_msisdn}
              </a>
            </div>

            <div className='flex items-center text-gray-600'>
              <span className='material-symbols-outlined text-gray-400 mr-2'>
                calendar_today
              </span>
              <span className='text-sm'>
                {toVnDateString(employee.emp_joinDate)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
