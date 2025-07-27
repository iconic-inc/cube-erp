import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { IRole } from '~/interfaces/role.interface';
import {
  Users,
  FileText,
  DollarSign,
  Scale,
  Gift,
  ArrowUpRight,
  UserCheck,
  Building,
} from 'lucide-react';
import { Link } from '@remix-run/react';
import {
  isAdmin,
  isAttorney,
  isAccountant,
  isSpecialist,
  canAccessEmployeeManagement,
  canAccessCaseServices,
  canAccessTransactionManagement,
  canAccessCustomerManagement,
  canAccessDocumentManagement,
  canAccessRewardManagement,
  canAccessAttendanceManagement,
  getRoleDisplayName,
} from '~/utils/permission';

interface RoleBasedSectionProps {
  userRole: IRole;
}

export default function RoleBasedSection({ userRole }: RoleBasedSectionProps) {
  const roleDisplayName = getRoleDisplayName(userRole);

  // Define quick actions based on role
  const getQuickActions = () => {
    const actions = [];

    // Common actions for all roles
    actions.push({
      title: 'Chấm công',
      description: 'Xem lịch sử chấm công của tôi',
      icon: UserCheck,
      href: '/erp/nhan-vien/cham-cong',
      color: 'bg-blue-100 text-blue-600',
    });

    actions.push({
      title: 'Công việc của tôi',
      description: 'Quản lý công việc được giao',
      icon: FileText,
      href: '/erp/nhan-vien/tasks',
      color: 'bg-green-100 text-green-600',
    });

    // Admin specific actions
    if (isAdmin(userRole)) {
      if (canAccessEmployeeManagement(userRole)) {
        actions.push({
          title: 'Quản lý nhân viên',
          description: 'Xem và quản lý danh sách nhân viên',
          icon: Users,
          href: '/erp/employees',
          color: 'bg-purple-100 text-purple-600',
        });
      }

      if (canAccessAttendanceManagement(userRole)) {
        actions.push({
          title: 'Quản lý chấm công',
          description: 'Xem chấm công của tất cả nhân viên',
          icon: UserCheck,
          href: '/erp/attendance',
          color: 'bg-indigo-100 text-indigo-600',
        });
      }
    }

    // Attorney specific actions
    if (isAttorney(userRole)) {
      if (canAccessCaseServices(userRole)) {
        actions.push({
          title: 'Quản lý vụ việc',
          description: 'Xem và xử lý các vụ việc pháp lý',
          icon: Scale,
          href: '/erp/cases',
          color: 'bg-red-100 text-red-600',
        });
      }

      if (canAccessCustomerManagement(userRole)) {
        actions.push({
          title: 'Quản lý khách hàng',
          description: 'Thông tin khách hàng và vụ việc',
          icon: Building,
          href: '/erp/customers',
          color: 'bg-yellow-100 text-yellow-600',
        });
      }
    }

    // Accountant specific actions
    if (isAccountant(userRole)) {
      if (canAccessTransactionManagement(userRole)) {
        actions.push({
          title: 'Quản lý giao dịch',
          description: 'Theo dõi thu chi và giao dịch',
          icon: DollarSign,
          href: '/erp/nhan-vien/transactions',
          color: 'bg-green-100 text-green-600',
        });
      }
    }

    // Specialist actions (similar to attorney but more limited)
    if (isSpecialist(userRole)) {
      if (canAccessCaseServices(userRole)) {
        actions.push({
          title: 'Hỗ trợ vụ việc',
          description: 'Hỗ trợ xử lý các vụ việc',
          icon: Scale,
          href: '/erp/cases',
          color: 'bg-orange-100 text-orange-600',
        });
      }
    }

    // Common access for document management
    if (canAccessDocumentManagement(userRole)) {
      actions.push({
        title: 'Tài liệu',
        description: 'Quản lý tài liệu và hồ sơ',
        icon: FileText,
        href: '/erp/documents',
        color: 'bg-gray-100 text-gray-600',
      });
    }

    // Reward access
    if (canAccessRewardManagement(userRole)) {
      actions.push({
        title: 'Quỹ thưởng',
        description: 'Xem thông tin quỹ thưởng',
        icon: Gift,
        href: '/erp/nhan-vien/rewards',
        color: 'bg-pink-100 text-pink-600',
      });
    }

    return actions;
  };

  const quickActions = getQuickActions();

  return (
    <Card className='h-full'>
      <CardHeader className='pb-4'>
        <CardTitle className='text-xl font-bold flex items-center'>
          <Users className='w-5 h-5 mr-2 text-red-900' />
          Khu vực làm việc - {roleDisplayName}
        </CardTitle>
        <p className='text-sm text-muted-foreground'>
          Các tính năng và quyền truy cập dành cho{' '}
          {roleDisplayName.toLowerCase()}
        </p>
      </CardHeader>

      <CardContent className='space-y-3'>
        <div className='grid grid-cols-1 gap-3'>
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant='ghost'
              className='h-auto p-4 justify-start hover:bg-muted/50'
              asChild
            >
              <Link to={action.href}>
                <div className='flex items-center space-x-3 w-full'>
                  <div className={`p-2 rounded-lg ${action.color}`}>
                    <action.icon className='w-5 h-5' />
                  </div>
                  <div className='flex-1 text-left'>
                    <div className='font-medium text-sm'>{action.title}</div>
                    <div className='text-xs text-muted-foreground'>
                      {action.description}
                    </div>
                  </div>
                  <ArrowUpRight className='w-4 h-4 text-muted-foreground' />
                </div>
              </Link>
            </Button>
          ))}
        </div>

        {/* Role-specific information */}
        <div className='mt-6 p-4 bg-muted/30 rounded-lg'>
          <h4 className='font-medium text-sm mb-2'>Thông tin quyền truy cập</h4>
          <div className='space-y-1 text-xs text-muted-foreground'>
            {isAdmin(userRole) && (
              <p>• Có quyền truy cập đầy đủ vào tất cả tính năng hệ thống</p>
            )}
            {isAttorney(userRole) && (
              <>
                <p>• Có thể tạo và quản lý vụ việc pháp lý</p>
                <p>• Truy cập thông tin khách hàng và tài liệu</p>
                <p>• Quản lý công việc cá nhân</p>
              </>
            )}
            {isAccountant(userRole) && (
              <>
                <p>• Quản lý đầy đủ giao dịch và tài chính</p>
                <p>• Xem thông tin vụ việc để lập hóa đơn</p>
                <p>• Truy cập tài liệu tài chính</p>
              </>
            )}
            {isSpecialist(userRole) && (
              <>
                <p>• Hỗ trợ xử lý vụ việc (chỉ đọc và cập nhật)</p>
                <p>• Truy cập tài liệu hỗ trợ</p>
                <p>• Quản lý công việc cá nhân</p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
