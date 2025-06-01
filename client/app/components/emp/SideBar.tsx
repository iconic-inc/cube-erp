import { useLoaderData, useLocation } from '@remix-run/react';
import { NavLink, useNavigate } from 'react-router-dom';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '~/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { ChevronUp, LogOut, User2 } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import { loader } from '~/routes/erp+/nhan-vien+/_layout';

export default function ERPSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useLoaderData<typeof loader>();

  const isActive = (link: string) =>
    link.replace('/erp/nhan-vien', '')
      ? location.pathname.includes(link)
      : location.pathname === link;

  const AccountItems = [
    { label: 'Tài khoản', icon: 'person', link: '/erp/nhan-vien/profile' },
    {
      label: 'Thông báo',
      icon: 'notifications',
      link: '/erp/nhan-vien/notifications',
    },
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
      navigate(`/erp/login?redirect=${location.pathname}`, {
        replace: true,
      });
    }
  };

  return (
    <Sidebar className='lg:h-screen'>
      <SidebarHeader>
        <div className='flex items-center mb-6'>
          <div className='bg-primary text-white p-1 rounded'>
            <span className='material-symbols-outlined text-xs'>grid_view</span>
          </div>
          <span className='text-primary font-semibold ml-2'>
            Cube Lawfirm ERP
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <Accordion type='single' collapsible defaultValue='item-1'>
            <AccordionItem value='item-1' className='border-b-0'>
              <AccordionTrigger>MENU</AccordionTrigger>

              <AccordionContent className='w-[--radix-popper-anchor-width] flex flex-col gap-4'>
                {MENU.map((item, i) => (
                  <NavItem key={i} item={item} />
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
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
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

const MENU = [
  { label: 'Trang chủ', icon: 'dashboard', link: '/erp/nhan-vien' },
  {
    label: 'Nhân sự',
    icon: 'people',
    link: '/erp/nhan-vien/employees',
  },
  // {
  //   label: 'Task board',
  //   icon: 'timeline',
  //   link: '/erp/nhan-vien/tasks',
  // },
  {
    label: 'KPI',
    icon: 'monitoring',
    link: '/erp/nhan-vien/kpi',
  },
  {
    label: 'Chấm công',
    icon: 'fact_check',
    link: '/erp/nhan-vien/attendance',
  },
];
