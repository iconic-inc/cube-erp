import { Link, useLoaderData, useLocation } from '@remix-run/react';
import { NavLink, useNavigate } from 'react-router-dom';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '~/components/ui/sidebar';
import { Bot, CreditCard, Folder, IdCard, User2 } from 'lucide-react';
import { loader } from '~/routes/erp+/nhan-vien+/_layout';
import SideNav from './SideNav';
import { NavUser } from './NavUser';

export default function ERPSidebar() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <Sidebar className='lg:h-screen'>
      <SidebarHeader>
        <Link to='/erp' className='flex items-center mb-6'>
          <div className='w-12 h-12 rounded-full overflow-hidden'>
            <img src='/assets/cube-lawfirm-logo.png' alt='Cube Lawfirm Logo' />
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
    title: 'Quản lý Nhân viên',
    url: '#',
    icon: IdCard,
    isActive: true,
    items: [
      {
        title: 'Chấm công',
        url: '/erp/nhan-vien/cham-cong',
      },
      {
        title: 'Task',
        url: '/erp/nhan-vien/tasks',
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
        url: '/erp/nhan-vien/crm/khach-hang',
      },
      {
        title: 'Hồ sơ vụ việc',
        url: '/erp/nhan-vien/crm/ho-so-vu-viec',
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
        url: '/erp/nhan-vien/giao-dich',
      },
      {
        title: 'Quỹ thưởng',
        url: '/erp/nhan-vien/thuong',
      },
      {
        title: 'Báo cáo',
        url: '/erp/nhan-vien/giao-dich/bao-cao',
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
        url: '/erp/nhan-vien/tai-lieu',
      },
    ],
  },
];
