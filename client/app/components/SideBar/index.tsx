import { Link, useLoaderData } from '@remix-run/react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '~/components/ui/sidebar';
import { Folder, User2, IdCard, CreditCard } from 'lucide-react';
import { loader } from '../../routes/erp+/_admin+/_layout';
import SideNav from './SideNav';
import { NavUser } from './NavUser';

export default function ERPSidebar() {
  const { user } = useLoaderData<typeof loader>();

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
    icon: IdCard,
    isActive: true,
    items: [
      {
        title: 'Nhân sự',
        url: '/erp/employees',
      },
      {
        title: 'Chấm công',
        url: '/erp/attendance',
      },
      {
        title: 'Task',
        url: '/erp/tasks',
      },
    ],
  },
  {
    title: 'Quản lý khách hàng',
    url: '#',
    icon: User2,
    isActive: true,
    items: [
      {
        title: 'Khách hàng',
        url: '/erp/crm/customers',
      },
      {
        title: 'Hồ sơ vụ việc',
        url: '/erp/crm/cases',
      },
    ],
  },
  {
    title: 'Tài chính',
    url: '#',
    icon: CreditCard,
    isActive: true,
    items: [
      {
        title: 'Giao dịch',
        url: '/erp/transactions',
      },
      {
        title: 'Báo cáo',
        url: '/erp/reports',
      },
    ],
  },
  {
    title: 'Khác',
    url: '#',
    icon: Folder,
    isActive: true,
    items: [
      {
        title: 'Tài liệu',
        url: '/erp/documents',
      },
    ],
  },
];
