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
              to={`${item.link}`}
              className={({
                isActive,
              }) => `flex items-center text-gray-500 hover:text-red-500 
                  transition duration-200 p-2 hover:bg-red-100 rounded-md ${
                    (
                      item.link.replace('/hrm/nhan-vien', '')
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
            {PROFILE_MENU.map((item, i) => (
              <NavLink
                key={i}
                to={item.link}
                className={({
                  isActive,
                }) => `flex items-center text-gray-500 hover:text-red-500 
                    transition duration-200 p-2 hover:bg-red-100 rounded-md ${
                      (
                        item.link.replace('/hrm/nhan-vien', '')
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
                  await fetch(`/hrm/logout`, {
                    method: 'POST',
                  });
                  navigate(`/hrm/login?redirect=${location.pathname}`, {
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
                      item.link.replace('/hrm/nhan-vien', '')
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
            {PROFILE_MENU.map((item, i) => (
              <NavLink
                key={i}
                to={item.link}
                className={({
                  isActive,
                }) => `flex items-center text-gray-500 hover:text-red-500 
                    transition duration-200 p-2 hover:bg-red-100 rounded-md ${
                      (
                        item.link.replace('/hrm/nhan-vien', '')
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
                  await fetch(`/hrm/logout`, {
                    method: 'POST',
                  });
                  navigate(`/hrm/login?redirect=${location.pathname}`, {
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
  {
    label: 'Trang chủ',
    icon: 'dashboard',
    link: '/hrm/nhan-vien',
  },
  {
    label: 'Chấm công',
    icon: 'fact_check',
    link: '/hrm/nhan-vien/cham-cong',
  },
  {
    label: 'KPI',
    icon: 'monitoring',
    link: '/hrm/nhan-vien/kpi',
  },
];

const PROFILE_MENU = [
  {
    label: 'Tài khoản',
    icon: 'person',
    link: '/hrm/nhan-vien/profile',
  },
  // {
  //   label: 'Chat',
  //   icon: 'chat',
  //   link: '/hrm/nhan-vien/chat',
  // },
  {
    label: 'Thông báo',
    icon: 'notifications',
    link: '/hrm/nhan-vien/thong-bao',
  },
];
