import { Badge } from '~/components/ui/badge';
import { Card, CardContent } from '~/components/ui/card';
import { IRole } from '~/interfaces/role.interface';
import {
  Shield,
  Users,
  Scale,
  Calculator,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import {
  getRoleDisplayName,
  isAdmin,
  isAttorney,
  isAccountant,
  isSpecialist,
} from '~/utils/permission';

interface RoleDisplayProps {
  userRole: IRole;
}

export default function RoleDisplay({ userRole }: RoleDisplayProps) {
  const roleDisplayName = getRoleDisplayName(userRole);

  const getRoleIcon = () => {
    if (isAdmin(userRole)) return ShieldCheck;
    if (isAttorney(userRole)) return Scale;
    if (isAccountant(userRole)) return Calculator;
    if (isSpecialist(userRole)) return UserCheck;
    return Shield;
  };

  const getRoleColor = () => {
    if (isAdmin(userRole))
      return 'bg-purple-100 text-purple-800 border-purple-200';
    if (isAttorney(userRole)) return 'bg-red-100 text-red-800 border-red-200';
    if (isAccountant(userRole))
      return 'bg-green-100 text-green-800 border-green-200';
    if (isSpecialist(userRole))
      return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const RoleIcon = getRoleIcon();

  return (
    <Card className='mb-6'>
      <CardContent className='p-4'>
        <div className='flex items-center space-x-3'>
          <div className={`p-2 rounded-lg ${getRoleColor()}`}>
            <RoleIcon className='w-5 h-5' />
          </div>
          <div className='flex-1'>
            <div className='flex items-center space-x-2'>
              <span className='font-medium text-sm'>Vai trò của bạn:</span>
              <Badge className={getRoleColor()}>{roleDisplayName}</Badge>
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              {isAdmin(userRole) &&
                'Bạn có quyền truy cập đầy đủ vào tất cả tính năng hệ thống'}
              {isAttorney(userRole) &&
                'Bạn có thể quản lý vụ việc, khách hàng và tài liệu pháp lý'}
              {isAccountant(userRole) &&
                'Bạn có thể quản lý giao dịch tài chính và báo cáo'}
              {isSpecialist(userRole) &&
                'Bạn có thể hỗ trợ xử lý vụ việc và quản lý tài liệu'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
