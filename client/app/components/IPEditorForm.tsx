import { useFetcher } from '@remix-run/react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

import { IOfficeIP } from '~/interfaces/officeIP.interface';
import { action } from '~/routes/api+/office-ip+/$id';

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
  const toastIdRef = useRef<any>(null);
  const [officeName, setOfficeName] = useState(officeIp?.officeName || '');
  const [ipAddress, setIpAddress] = useState(officeIp?.ipAddress || '');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (fetcher.data) {
      setIsLoading(false);
      if (fetcher.data?.toast && toastIdRef.current) {
        const { toast: toastData } = fetcher.data as any;
        toast.update(toastIdRef.current, {
          render: toastData.message,
          type: toastData.type || 'success', // Default to 'success' if type is not provided
          autoClose: 3000,
          isLoading: false,
        });

        if (fetcher.data?.toast.type === 'success') {
          setOfficeName('');
          setIpAddress('');
          setShowIPEditorForm(false);

          setEditIp?.(null);
        }

        toastIdRef.current = null;
      }

      toast.update(toastIdRef.current, {
        render: fetcher.data?.toast.message,
        autoClose: 3000,
        isLoading: false,
        type: 'error',
      });
      toastIdRef.current = null;
    }
  }, [fetcher.data]);

  return (
    <fetcher.Form
      method={type === 'update' ? 'PUT' : 'POST'}
      action={
        type === 'update' ? `/api/office-ip/${officeIp?.id}` : '/api/office-ip'
      }
      className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition duration-200'
      onSubmit={(e) => {
        if (toastIdRef.current) {
          toast.dismiss(toastIdRef.current);
        }
        toastIdRef.current = toast.loading(
          type === 'update'
            ? 'Đang cập nhật địa chỉ IP...'
            : 'Đang lưu địa chỉ IP...',
        );

        setIsLoading(true);
      }}
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
        <button
          className='h-7 w-7 md:h-8 md:w-8 p-1 text-green-500 hover:bg-green-100 rounded-full transition-all flex-shrink-0'
          disabled={isLoading}
          type='submit'
        >
          <span className='material-symbols-outlined text-sm md:text-base'>
            check
          </span>
        </button>

        <button
          className='h-7 w-7 md:h-8 md:w-8 text-red-500 hover:bg-red-100 p-1 rounded-full transition-all flex-shrink-0'
          type='button'
          onClick={() => {
            if (type === 'update') {
              setEditIp?.(null);
            }

            toast.dismiss(toastIdRef.current);
            toastIdRef.current = null;
            setIsLoading(false);
            setShowIPEditorForm(false);
            setOfficeName('');
            setIpAddress('');
          }}
        >
          <span className='material-symbols-outlined text-sm md:text-base'>
            close
          </span>
        </button>

        {type === 'update' && (
          <button
            className='h-7 w-7 md:h-8 md:w-8 text-red-500 hover:bg-red-50 p-1 rounded-full transition-all flex-shrink-0'
            type='button'
            onClick={() => {
              toastIdRef.current = toast.loading('Đang xóa địa chỉ IP...');
              fetcher.submit(
                {},
                {
                  method: 'DELETE',
                  action: `/api/office-ip/${officeIp?.id}`,
                },
              );

              setIsLoading(true);
            }}
          >
            <span className='material-symbols-outlined text-sm md:text-base'>
              delete
            </span>
          </button>
        )}
      </div>
    </fetcher.Form>
  );
}
