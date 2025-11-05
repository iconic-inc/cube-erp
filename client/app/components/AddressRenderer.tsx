import { useMemo } from 'react';
import Defer from './Defer';
import { toAddressString } from '~/utils/address.util';

type IAddress = {
  provinceId?: string;
  wardId?: string;
  street: string;
};

export default function AddressRenderer({ address }: { address: IAddress }) {
  return (
    <Defer resolve={useMemo(async () => await toAddressString(address), [])}>
      {(result) => result}
    </Defer>
  );
}
