import { Link, useLoaderData, useLocation } from '@remix-run/react';
import { NavLink, useNavigate } from 'react-router-dom';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '~/components/ui/sidebar';
import { Bot, Folder, User2 } from 'lucide-react';
import { loader } from '~/routes/erp+/nhan-vien+/_layout';
import SideNav from './SideNav';
import { NavUser } from './NavUser';

export default function ERPSidebar() {
  const location = useLocation();
  const { user } = useLoaderData<typeof loader>();

  const isActive = (link: string) =>
    link.replace('/erp', '')
      ? location.pathname.includes(link)
      : location.pathname === link;

  const AccountItems = [
    { label: 'Tài khoản', icon: 'person', link: '/erp/profile' },
    { label: 'Thông báo', icon: 'notifications', link: '/erp/notifications' },
  ];

  const NavItem = ({
    item,
  }: {
    item: {
      link: string;
      label: string;
      icon: React.ReactNode;
      onClick?: (...args: any) => any;
    };
  }) => (
    <NavLink
      to={item.link}
      className={`w-full flex items-center text-sm p-2 rounded-md transition-colors duration-200 hover:bg-red-100 hover:text-red-500 ${
        isActive(item.link) ? 'bg-red-500 text-white' : 'text-gray-500'
      }`}
      onClick={item.onClick}
    >
      <span className='material-symbols-outlined text-lg'>{item.icon}</span>
      <span className='ml-3'>{item.label}</span>
    </NavLink>
  );

  return (
    <Sidebar className='lg:h-screen'>
      <SidebarHeader>
        <Link to='/erp' className='flex items-center mb-6'>
          <div className='bg-primary text-white p-1 rounded'>
            <span className='material-symbols-outlined text-xs'>grid_view</span>
          </div>
          <span className='text-primary font-semibold ml-2'>
            Cube Lawfirm ERP
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SideNav items={navMain} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={{
            avatar:
              user.usr_avatar?.img_url || '/assets/user-avatar-placeholder.jpg',
            email: user.usr_email,
            name: `${user.usr_firstName} ${user.usr_lastName}`,
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}

const navMain = [
  {
    title: 'Quản lý nhân sự',
    url: '#',
    icon: User2,
    isActive: true,
    items: [
      {
        title: 'Nhân sự',
        url: '/erp/nhan-vien/employees',
      },
      {
        title: 'Chấm công',
        url: '#',
      },
    ],
  },
  {
    title: 'Quản lý khách hàng',
    url: '#',
    icon: Bot,
    isActive: true,
    items: [
      {
        title: 'Khách hàng',
        url: '/erp/nhan-vien/crm/customers',
      },
      {
        title: 'Hồ sơ vụ việc',
        url: '/erp/nhan-vien/crm/cases',
      },
    ],
  },
  {
    title: 'Quản lý tài liệu',
    url: '#',
    icon: Folder,
    isActive: true,
    items: [
      {
        title: 'Tài liệu',
        url: '/erp/nhan-vien/documents',
      },
      {
        title: 'Thư viện mẫu',
        url: '/erp/nhan-vien/documents/templates',
      },
    ],
  },
];
