import { useFetcher } from '@remix-run/react';
import { Check, Trash2, X } from 'lucide-react';
import { useState } from 'react';

import { IOfficeIP } from '~/interfaces/officeIP.interface';
import { action } from '~/routes/api+/office-ip+/$id';
import { Button } from './ui/button';
import { useFetcherResponseHandler } from '~/hooks/useFetcherResponseHandler';

export default function IPEditorForm({
  officeIp,
  setShowIPEditorForm,
  type,
  setEditIp,
}: {
  officeIp?: IOfficeIP;
  type: 'update' | 'create';
  setShowIPEditorForm: React.Dispatch<React.SetStateAction<boolean>>;
  setEditIp?: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const fetcher = useFetcher<typeof action>();
  const [officeName, setOfficeName] = useState(officeIp?.officeName || '');
  const [ipAddress, setIpAddress] = useState(officeIp?.ipAddress || '');

  const { isSubmitting } = useFetcherResponseHandler(fetcher, {
    onSuccess: () => {
      setOfficeName('');
      setIpAddress('');
      setShowIPEditorForm(false);

      setEditIp?.(null);
    },
  });

  return (
    <fetcher.Form
      method={type === 'update' ? 'PUT' : 'POST'}
      action={
        type === 'update' ? `/api/office-ip/${officeIp?.id}` : '/api/office-ip'
      }
      className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition duration-200'
    >
      <div className='w-full sm:w-auto space-y-2'>
        <label className='block text-xs md:text-sm font-medium text-gray-700 mb-1 border-b border-gray-300'>
          <input
            className='bg-transparent font-medium text-xs md:text-sm focus-visible:outline-none placeholder:text-gray-400 border-b w-full'
            name='officeName'
            value={officeName}
            onChange={(e) => setOfficeName(e.target.value)}
            placeholder='Tên văn phòng*'
            required
          />
        </label>

        <label className='block text-xs md:text-sm font-medium text-gray-700 mb-1 border-b border-gray-300'>
          <input
            className='bg-transparent font-medium text-xs md:text-sm border-b focus-visible:outline-none placeholder:text-gray-400 w-full'
            name='ipAddress'
            value={ipAddress}
            onChange={(e) => setIpAddress(e.target.value)}
            placeholder='(Để trống để đặt IP hiện tại)'
          />
        </label>
      </div>

      <div className='flex space-x-2 items-center self-end sm:self-auto'>
        <Button
          variant='ghost'
          className='w-8 h-8 hover:bg-green-500/20 text-green-500 hover:text-green-600 rounded-full transition-all flex-shrink-0'
          disabled={isSubmitting}
          type='submit'
        >
          <Check className='h-4 w-4' />
        </Button>

        <Button
          variant={'ghost'}
          className='w-8 h-8 hover:bg-red-500/20 text-red-500 hover:text-red-600 rounded-full transition-all flex-shrink-0'
          type='button'
          onClick={() => {
            if (type === 'update') {
              setEditIp?.(null);
            }

            setShowIPEditorForm(false);
            setOfficeName('');
            setIpAddress('');
          }}
        >
          <X className='h-4 w-4' />
        </Button>

        {type === 'update' && (
          <Button
            variant='ghost'
            className='w-8 h-8 hover:bg-red-500/20 text-red-500 hover:text-red-600 rounded-full transition-all flex-shrink-0'
            type='button'
            onClick={() => {
              fetcher.submit(
                {},
                {
                  method: 'DELETE',
                  action: `/api/office-ip/${officeIp?.id}`,
                },
              );
            }}
          >
            <Trash2 className='h-4 w-4' />
          </Button>
        )}
      </div>
    </fetcher.Form>
  );
}
