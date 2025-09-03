import { getFormattedAddress } from 'new-vn-provinces/dist/hierarchy';

type IAddress = {
  provinceId?: string;
  wardId?: string;
  street: string;
};

const toAddressString = (address: IAddress) => {
  if (!address.wardId) {
    return address.street;
  }

  return `${address.street}, ${getFormattedAddress(address.wardId)}`;
};

export { toAddressString };
