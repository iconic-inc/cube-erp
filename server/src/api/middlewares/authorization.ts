import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../core/errors';
import { getUserById } from '@services/user.service';
import { getPermissions } from '@services/role.service';
import { AccessControl, Permission, Query } from 'accesscontrol';

const ac = new AccessControl();
/**
 * Middleware kiểm tra quyền truy cập
 * @param resource - Tên resource (ví dụ: 'users', 'employees', etc.)
 * @param action - Hành động ('create', 'read', 'update', 'delete')
 */
export const hasPermission = (resource: string, action: keyof Query) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;

      // Lấy thông tin user và populate roles
      const user = await getUserById(userId);
      if (!user) {
        throw new ForbiddenError('User not found');
      }

      const permissions = await getPermissions(user.usr_role?.slug || '');
      if (!permissions || permissions.length === 0) {
        throw new ForbiddenError('Access denied');
      }

      // Kiểm tra quyền truy cập
      ac.setGrants(permissions);
      const permission = ac
        .can(user.usr_role?.slug || '')
        [action](resource) as Permission;
      if (permission.granted) {
        // Nếu có quyền phù hợp, tiếp tục xử lý
        return next();
      }

      // Nếu không có quyền phù hợp, trả về lỗi
      throw new ForbiddenError('Access denied');
    } catch (error) {
      next(error);
    }
  };
};
