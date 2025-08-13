import { IRole } from '~/interfaces/role.interface';

/**
 * Check if user role is in allowed roles
 */
export const hasRole = (
  userRole: IRole | undefined,
  allowedRoles: string[],
): boolean => {
  if (!userRole?.slug) return false;
  return allowedRoles.includes(userRole.slug);
};

/**
 * Check if user is admin
 */
export const isAdmin = (userRole: IRole | undefined): boolean => {
  return userRole?.slug === 'admin';
};

/**
 * Check if user is attorney
 */
export const isAttorney = (userRole: IRole | undefined): boolean => {
  return userRole?.slug === 'attorney';
};

/**
 * Check if user is specialist
 */
export const isSpecialist = (userRole: IRole | undefined): boolean => {
  return userRole?.slug === 'specialist';
};

/**
 * Check if user is accountant
 */
export const isAccountant = (userRole: IRole | undefined): boolean => {
  return userRole?.slug === 'accountant';
};

/**
 * Get user role display name
 */
export const getRoleDisplayName = (userRole: IRole | undefined): string => {
  if (!userRole) return 'Không xác định';

  switch (userRole.slug) {
    case 'admin':
      return 'Quản trị hệ thống';
    case 'attorney':
      return 'Luật sư';
    case 'specialist':
      return 'Chuyên viên';
    case 'accountant':
      return 'Kế toán';
    default:
      return userRole.name || 'Không xác định';
  }
};

/**
 * Check if user can access employee management
 */
export const canAccessEmployeeManagement = (
  userRole: IRole | undefined,
): boolean => {
  return hasRole(userRole, ['admin']);
};

/**
 * Check if user can access attendance management
 */
export const canAccessAttendanceManagement = (
  userRole: IRole | undefined,
): boolean => {
  return hasRole(userRole, ['admin']);
};

/**
 * Check if user can access case services
 */
export const canAccessCaseServices = (userRole: IRole | undefined): boolean => {
  return hasRole(userRole, ['admin', 'attorney', 'specialist', 'accountant']);
};

/**
 * Check if user can access customer management
 */
export const canAccessCustomerManagement = (
  userRole: IRole | undefined,
): boolean => {
  return hasRole(userRole, ['admin', 'attorney', 'specialist', 'accountant']);
};

/**
 * Check if user can access task management
 */
export const canAccessTaskManagement = (
  userRole: IRole | undefined,
): boolean => {
  return hasRole(userRole, ['admin', 'attorney', 'specialist', 'accountant']);
};

/**
 * Check if user can access transaction management
 */
export const canAccessTransactionManagement = (
  userRole: IRole | undefined,
): boolean => {
  return hasRole(userRole, ['admin', 'accountant']);
};

/**
 * Check if user can access document management
 */
export const canAccessDocumentManagement = (
  userRole: IRole | undefined,
): boolean => {
  return hasRole(userRole, ['admin', 'attorney', 'specialist', 'accountant']);
};

/**
 * Check if user can access reward management
 */
export const canAccessRewardManagement = (
  userRole: IRole | undefined,
): boolean => {
  return hasRole(userRole, ['admin', 'attorney', 'specialist', 'accountant']);
};
