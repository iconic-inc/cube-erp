import { useLocation } from '@remix-run/react';
import { NavLink, useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className='w-full lg:w-[240px] bg-white shadow-lg p-4 lg:p-6 flex flex-col lg:h-screen lg:fixed'>
      <div className='flex items-center mb-6 lg:mb-10'>
        <div className='bg-red-500 text-white p-1 rounded-md'>
          <span className='material-symbols-outlined text-xs'>grid_view</span>
        </div>
        <span className='text-red-500 font-bold ml-2'>Iconic Inc.</span>
      </div>

      <details className='lg:hidden mb-4'>
        <summary className='text-xs text-gray-500 font-semibold cursor-pointer flex items-center justify-between'>
          MENU
          <span className='material-symbols-outlined'>expand_more</span>
        </summary>
        <div className='mt-2 space-y-2'>
          {MENU.map((item, i) => (
            <NavLink
              key={i}
              to={item.link}
              className='flex items-center text-gray-500 hover:text-red-500 transition duration-200 p-2 hover:bg-gray-100 rounded-md'
            >
              <span className='material-symbols-outlined text-lg'>
                {item.icon}
              </span>
              <span className='ml-3 text-sm'>{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className='mt-6'>
          <div className='text-xs text-gray-500 font-semibold mb-4'>
            ACCOUNT
          </div>
          <div className='space-y-4'>
            {ACCOUNT_MENU.map((item, i) => (
              <NavLink
                key={i}
                to={item.link}
                className={({
                  isActive,
                }) => `flex items-center text-gray-500 hover:text-red-500 
                    transition duration-200 p-2 hover:bg-red-100 rounded-md ${
                      (
                        item.link.replace('/erp', '')
                          ? location.pathname.includes(item.link)
                          : location.pathname === item.link
                      )
                        ? 'bg-red-500 text-white'
                        : ''
                    }`}
              >
                <span className='material-symbols-outlined text-lg'>
                  {item.icon}
                </span>
                <span className='ml-3 text-sm'>{item.label}</span>
              </NavLink>
            ))}

            <button
              className={`flex items-center text-gray-500 hover:text-red-500 
                    transition duration-200 p-2 hover:bg-red-100 rounded-md w-full`}
              onClick={async (e) => {
                e.preventDefault();

                if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
                  await fetch('/erp/logout', { method: 'POST' });
                  navigate(`/erp/login?redirect=${location.pathname}`, {
                    replace: true,
                  });
                }
              }}
            >
              <span className='material-symbols-outlined text-lg'>logout</span>
              <span className='ml-3 text-sm'>Đăng xuất</span>
            </button>
          </div>
        </div>
      </details>

      <div className='hidden lg:block h-full'>
        <div className='text-xs text-gray-500 font-semibold mb-4'>MENU</div>
        <div className='space-y-4 flex-1'>
          {MENU.map((item, i) => (
            <NavLink
              key={i}
              to={`${item.link}`}
              className={({
                isActive,
              }) => `flex items-center text-gray-500 hover:text-red-500 
                  transition duration-200 p-2 hover:bg-red-100 rounded-md ${
                    (
                      item.link.replace('/erp', '')
                        ? location.pathname.includes(item.link)
                        : location.pathname === item.link
                    )
                      ? 'bg-red-500 text-white'
                      : ''
                  }`}
            >
              <span className='material-symbols-outlined text-lg'>
                {item.icon}
              </span>
              <span className='ml-3 text-sm'>{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className='mt-6'>
          <div className='text-xs text-gray-500 font-semibold mb-4'>
            ACCOUNT
          </div>
          <div className='space-y-4'>
            {ACCOUNT_MENU.map((item, i) => (
              <NavLink
                key={i}
                to={item.link}
                className={({
                  isActive,
                }) => `flex items-center text-gray-500 hover:text-red-500 
                    transition duration-200 p-2 hover:bg-red-100 rounded-md ${
                      (
                        item.link.replace('/erp', '')
                          ? location.pathname.includes(item.link)
                          : location.pathname === item.link
                      )
                        ? 'bg-red-500 text-white'
                        : ''
                    }`}
              >
                <span className='material-symbols-outlined text-lg'>
                  {item.icon}
                </span>
                <span className='ml-3 text-sm'>{item.label}</span>
              </NavLink>
            ))}

            <button
              className={`flex items-center text-gray-500 hover:text-red-500 
                    transition duration-200 p-2 hover:bg-red-100 rounded-md w-full`}
              onClick={async (e) => {
                e.preventDefault();

                if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
                  await fetch('/erp/logout', { method: 'POST' });
                  navigate(`/erp/login?redirect=${location.pathname}`, {
                    replace: true,
                  });
                }
              }}
            >
              <span className='material-symbols-outlined text-lg'>logout</span>
              <span className='ml-3 text-sm'>Đăng xuất</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const MENU = [
  { label: 'Trang chủ', icon: 'dashboard', link: '/erp' },
  {
    label: 'Chủ Spa',
    icon: 'diversity_1',
    link: '/erp/spa-owners',
  },
  {
    label: 'Spa',
    icon: 'spa',
    link: '/erp/spas',
  },
  {
    label: 'Review',
    icon: 'stars_2',
    link: '/erp/reviews',
  },
  {
    label: 'Tin tuyển dụng',
    icon: 'work',
    link: '/erp/job-posts',
  },
  {
    label: 'Đơn ứng tuyển',
    icon: 'assignment_ind',
    link: '/erp/job-applications',
  },
];

const ACCOUNT_MENU = [
  {
    label: 'Tài khoản',
    icon: 'manage_accounts',
    link: '/erp/profile',
  },
];
