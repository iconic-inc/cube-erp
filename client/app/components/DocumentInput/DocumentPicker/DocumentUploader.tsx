import { useFetcher } from '@remix-run/react';
import { UploadCloud } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { IDocument } from '~/interfaces/document.interface';
import { action } from '~/routes/api+/documents+/upload';

export default function DocumentUploader({
  multiple = true,
  handleDocumentUploaded,
  ...props
}: { handleDocumentUploaded: (document: IDocument[]) => void } & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'value'
>) {
  const fetcher = useFetcher<typeof action>();
  const toastIdRef = useRef<any>(null);

  useEffect(() => {
    if (fetcher.data?.toast) {
      toast.update(toastIdRef.current, {
        type: fetcher.data.toast.type as 'success' | 'error',
        render: fetcher.data.toast.message,
        ...toastUpdateOptions,
      });

      if (fetcher.data.toast.type === 'success') {
        handleDocumentUploaded(fetcher.data.documents);
      }
    }
  }, [fetcher.data]);

  return (
    <div className={`flex gap-4 items-center justify-center h-full`}>
      <label className='cursor-pointer flex-col w-1/2 items-center rounded-xl border-2 border-dashed border-blue-400 bg-white p-6 text-center'>
        <UploadCloud className='w-6 h-6 text-blue-400 m-auto' />

        <h2 className='text-xl mt-2 font-medium text-gray-700 tracking-wide'>
          Upload Document
        </h2>

        <p className='mt-2 text-gray-500 tracking-wide'>
          Upload your file SVG, PNG, JPG or GIF.
        </p>

        <input
          type='file'
          accept='document/*'
          hidden
          multiple
          onChange={async (e) => {
            toastIdRef.current = toast.loading('Uploading document...');

            if (!e.target.files || e.target.files.length === 0) {
              toast.update(toastIdRef.current, {
                type: 'error',
                render: 'No document selected',
                ...toastUpdateOptions,
              });
              return;
            }

            try {
              const formData = new FormData();
              for (let i = 0; i < e.target.files.length; i++) {
                formData.append('documents', e.target.files[i]);
              }

              fetcher.submit(formData, {
                method: 'POST',
                encType: 'multipart/form-data',
                action: '/api/documents/upload',
              });
            } catch (err: any) {
              toast.update(toastIdRef.current, {
                type: 'error',
                data: err.message,
              });
            }
          }}
        />
      </label>
    </div>
  );
}

const toastUpdateOptions = {
  autoClose: 3000,
  isLoading: false,
};
