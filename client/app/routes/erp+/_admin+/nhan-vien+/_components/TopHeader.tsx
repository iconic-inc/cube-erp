import { Link, useNavigate } from '@remix-run/react';
import { IEmployee } from '~/interfaces/employee.interface';
import HRMButton from '../../_components/HRMButton';

export default function TopHeader({ employee }: { employee?: IEmployee }) {
  const navigate = useNavigate();

  return (
    <div className='flex flex-row justify-between items-start md:items-center mb-6 gap-4'>
      <HRMButton
        color='red'
        tagType='link'
        href='/crm'
        target='_blank'
        className='w-fit'
      >
        Quản lý khách hàng
        <span className='material-symbols-outlined text-sm ml-1'>
          open_in_new
        </span>
      </HRMButton>

      <div className='flex items-center space-x-4 ml-auto'>
        <Link
          to='/hrm/nhan-vien/thong-bao'
          className='relative cursor-pointer hover:bg-gray-100 p-2 rounded-full transition duration-200 group'
        >
          <span className='material-symbols-outlined text-gray-500 group-hover:text-blue-500'>
            notifications
          </span>
          <div className='absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full'></div>
        </Link>

        {/* <div className='relative cursor-pointer hover:bg-gray-100 p-2 rounded-full transition duration-200 group'>
          <span className='material-symbols-outlined text-gray-500 group-hover:text-blue-500'>
            mail
          </span>
          <div className='absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full'></div>
        </div> */}

        <button
          className='flex items-center cursor-pointer hover:bg-gray-100 p-1 rounded-md transition-all duration-200 text-start'
          onClick={() => navigate('/hrm/nhan-vien/profile')}
        >
          <div className='w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold uppercase'>
            {employee?.userId.usr_firstName[0]}
          </div>

          <div className='ml-2 hidden sm:block overflow-hidden'>
            <div className='text-sm font-medium truncate'>{`${employee?.userId?.usr_firstName} ${employee?.userId?.usr_lastName}`}</div>
            <div className='text-xs text-gray-500 truncate'>
              {employee?.userId?.usr_role.name}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
