import { IOfficeIP, IOfficeIPCreate } from '~/interfaces/officeIP.interface';
import { fetcher } from '.';
import { ISessionUser } from '~/interfaces/auth.interface';

const createOfficeIP = async (data: IOfficeIPCreate, request: ISessionUser) => {
  const officeIP = await fetcher<any>('/office-ips', {
    method: 'POST',
    body: JSON.stringify(data),
    request,
  });

  return officeIP as IOfficeIP;
};

const getOfficeIPs = async (request: ISessionUser) => {
  const officeIPs = await fetcher<any>('/office-ips', { request });
  return officeIPs as IOfficeIP[];
};

const getOfficeIPById = async (id: string, request: ISessionUser) => {
  const officeIP = await fetcher<any>(`/office-ips/${id}`, { request });
  return officeIP as IOfficeIP;
};

const updateOfficeIP = async (
  id: string,
  data: IOfficeIPCreate,
  request: ISessionUser,
) => {
  const officeIP = await fetcher<any>(`/office-ips/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    request,
  });

  return officeIP as IOfficeIP;
};

const deleteOfficeIP = async (id: string, request: ISessionUser) => {
  const officeIP = await fetcher<any>(`/office-ips/${id}`, {
    method: 'DELETE',
    request,
  });
  return officeIP as IOfficeIP;
};
export {
  createOfficeIP,
  getOfficeIPs,
  getOfficeIPById,
  updateOfficeIP,
  deleteOfficeIP,
};
