import { Link, useLoaderData } from '@remix-run/react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '~/components/ui/sidebar';
import { Folder, IdCard, CreditCard, Users } from 'lucide-react';
import { loader } from '../../routes/erp+/_admin+/_layout';
import SideNav from './SideNav';
import { NavUser } from './NavUser';
import { IUser } from '~/interfaces/user.interface';
import {
  canAccessCaseServices,
  canAccessCustomerManagement,
  canAccessDocumentManagement,
  canAccessRewardManagement,
  canAccessTransactionManagement,
  isAdmin,
} from '~/utils/permission';

export default function ERPSidebar() {
  const { employee } = useLoaderData<typeof loader>();
  const user = employee?.emp_user;
  const navMain = getNavItems(user);

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

// Generate navigation items based on user role
const getNavItems = (user: IUser) => {
  const navItems = [];

  if (isAdmin(user.usr_role)) {
    return [
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
          {
            title: 'Xếp hạng Nhân viên',
            url: '/erp/tasks/performance',
          },
        ],
      },
      {
        title: 'Quản lý khách hàng',
        url: '#',
        icon: Users,
        isActive: true,
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
            title: 'Quỹ thưởng',
            url: '/erp/rewards',
          },
          {
            title: 'Báo cáo',
            url: '/erp/transactions/reports',
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
  } else {
    // Personal Management - Always available
    const personalItems = [
      {
        title: 'Trang chủ',
        url: '/erp/nhan-vien',
      },
      {
        title: 'Chấm công',
        url: '/erp/nhan-vien/cham-cong',
      },
      {
        title: 'Tasks',
        url: '/erp/nhan-vien/tasks',
      },
      {
        title: 'Hồ sơ cá nhân',
        url: '/erp/profile',
      },
    ];

    navItems.push({
      title: 'Cá nhân',
      url: '#',
      icon: IdCard,
      isActive: true,
      items: personalItems,
    });
  }

  const CRMItems = [];
  // Customer Management - For attorneys and specialists
  if (canAccessCustomerManagement(user?.usr_role)) {
    CRMItems.push({
      title: 'Khách hàng',
      url: '/erp/customers',
    });
  }

  // Case Services - For attorneys and specialists
  if (canAccessCaseServices(user?.usr_role)) {
    CRMItems.push({
      title: 'Hồ sơ vụ việc',
      url: '/erp/nhan-vien/cases',
    });
  }

  const financialItems = [];
  if (canAccessTransactionManagement(user?.usr_role)) {
    financialItems.push({
      title: 'Giao dịch',
      url: '/erp/transactions',
    });
  }

  const otherItems = [];
  // Document Management - Role-based access
  // Rewards - Available to all
  if (canAccessRewardManagement(user?.usr_role)) {
    otherItems.push({
      title: 'Quỹ thưởng',
      url: '/erp/rewards',
    });
  }

  if (canAccessDocumentManagement(user?.usr_role)) {
    otherItems.push({
      title: 'Quản lý tài liệu',
      url: '/erp/documents',
    });
  }

  if (CRMItems.length > 0) {
    navItems.push({
      title: 'Quản lý khách hàng',
      url: '#',
      icon: Users,
      isActive: true,
      items: CRMItems,
    });
  }
  if (financialItems.length > 0) {
    navItems.push({
      title: 'Quản lý tài chính',
      url: '#',
      icon: CreditCard,
      isActive: true,
      items: financialItems,
    });
  }
  if (otherItems.length > 0) {
    navItems.push({
      title: 'Khác',
      url: '#',
      icon: Folder,
      isActive: true,
      items: otherItems,
    });
  }

  return navItems;
};
