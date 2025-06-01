import { Link, useLoaderData, useLocation } from '@remix-run/react';
import { NavLink, useNavigate } from 'react-router-dom';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '~/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { BookOpen, Bot, ChevronUp, SquareTerminal, User2 } from 'lucide-react';
import { loader } from '../../routes/erp+/_admin+/_layout';
import SideNav from './SideNav';
import { NavUser } from './NavUser';

export default function ERPSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
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

  const handleLogout = async (e: any) => {
    e.preventDefault();
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      await fetch('/erp/logout', { method: 'POST' });
      navigate(`/erp/login?redirect=${location.pathname}`, { replace: true });
    }
  };

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
        {/* <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className='h-12'>
                  <User2 /> {`${user?.usr_firstName} ${user?.usr_lastName}`}
                  <ChevronUp className='ml-auto' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side='top'
                className='w-[--radix-popper-anchor-width] flex flex-col gap-2'
              >
                {AccountItems.map((item, i) => (
                  <DropdownMenuItem key={i} className='p-0'>
                    <NavItem item={item} />
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem className='p-0'>
                  <NavItem
                    item={{
                      link: '/erp/logout',
                      label: 'Đăng xuất',
                      icon: 'logout',
                      onClick: handleLogout,
                    }}
                  />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu> */}
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
        url: '/erp/employees',
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
    items: [
      {
        title: 'Khách hàng',
        url: '/erp/customers',
      },
      {
        title: 'Hồ sơ vụ việc',
        url: '/erp/cases',
      },
    ],
  },
];
