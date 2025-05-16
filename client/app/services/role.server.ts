import { ISessionUser } from '~/interfaces/auth.interface';
import { fetcher } from '.';
import { ICreateRole, IRole, IUpdateRole } from '~/interfaces/role.interface';

// Lấy danh sách roles
const getRoles = async (request: ISessionUser) => {
  try {
    const response = await fetcher('/roles', { request });

    return response as IRole[];
  } catch (error) {
    console.error('Error fetching roles:', error);
    return [] as IRole[];
  }
};

// Lấy thông tin một role
const getRoleById = async (id: string, request: ISessionUser) => {
  const response = await fetcher(`/roles/${id}`, { request });
  return response as IRole;
};

// Tạo role mới
const createRole = async (data: ICreateRole, request: ISessionUser) => {
  const response = await fetcher('/roles', {
    method: 'POST',
    body: JSON.stringify(data),
    request,
  });
  return response as IRole;
};

// Cập nhật role
const updateRole = async (
  id: string,
  data: IUpdateRole,
  request: ISessionUser,
) => {
  const response = await fetcher(`/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    request,
  });
  return response as IRole;
};

// Xóa role
const deleteRole = async (id: string, request: ISessionUser) => {
  const response = await fetcher(`/roles/${id}`, {
    method: 'DELETE',
    request,
  });
  return response as { message: string; metadata: { success: boolean } };
};

// Cập nhật quyền của role
const updateRoleGrants = async (
  id: string,
  grants: { resourceId: string; actions: string[] }[],
  request: ISessionUser,
) => {
  const response = await fetcher(`/roles/${id}/grants`, {
    method: 'PUT',
    body: JSON.stringify({ grants }),
    request,
  });
  return response as IRole;
};

export {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  updateRoleGrants,
};
