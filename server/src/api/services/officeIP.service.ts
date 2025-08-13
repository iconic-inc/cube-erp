import { OfficeIPModel } from '@models/officeIP.model';
import { IOfficeIPCreate } from '../interfaces/officeIP.interface';
import { getReturnData, getReturnList } from '@utils/index';

const createOfficeIPAddress = async (data: IOfficeIPCreate) => {
  const ipAddress = data.ipAddress.split('.').map(Number);
  if (ipAddress.length !== 4 || ipAddress.some((num) => num < 0 || num > 255)) {
    throw new Error('Invalid IP address');
  }

  const officeIP = await OfficeIPModel.build({
    ...data,
    status: true,
  });
  if (!officeIP) {
    throw new Error('Failed to create office IP address');
  }

  return getReturnData(officeIP, { without: ['__v'] });
};

const getAllOfficeIPAddresses = async () => {
  const officeIPs = await OfficeIPModel.find({}, '-__v');
  if (!officeIPs) {
    throw new Error('Failed to fetch office IP addresses');
  }

  return getReturnList(officeIPs);
};

const getOfficeIPAddressById = async (id: string) => {
  const officeIP = await OfficeIPModel.findById(id, '-__v');
  if (!officeIP) {
    throw new Error('Failed to fetch office IP address');
  }

  return getReturnData(officeIP);
};

const updateOfficeIPAddress = async (id: string, data: IOfficeIPCreate) => {
  const ipAddress = data.ipAddress.split('.').map(Number);
  if (ipAddress.length !== 4 || ipAddress.some((num) => num < 0 || num > 255)) {
    throw new Error('Invalid IP address');
  }

  const officeIP = await OfficeIPModel.findByIdAndUpdate(
    id,
    { ...data, status: true },
    { new: true }
  );
  if (!officeIP) {
    throw new Error('Failed to update office IP address');
  }

  return getReturnData(officeIP, { without: ['__v'] });
};

const deleteOfficeIPAddress = async (id: string) => {
  const officeIP = await OfficeIPModel.findByIdAndDelete(id);
  if (!officeIP) {
    throw new Error('Failed to delete office IP address');
  }

  return getReturnData(officeIP, { without: ['__v'] });
};

export {
  createOfficeIPAddress,
  getAllOfficeIPAddresses,
  getOfficeIPAddressById,
  updateOfficeIPAddress,
  deleteOfficeIPAddress,
};
