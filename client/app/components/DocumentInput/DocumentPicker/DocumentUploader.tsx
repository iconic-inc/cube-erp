import { useFetcher } from '@remix-run/react';
import { UploadCloud } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { FilePondFile, FilePondInitialFile } from 'filepond';
import { FilePond } from 'react-filepond';
import 'filepond/dist/filepond.min.css';

import { IDocument } from '~/interfaces/document.interface';
import { action } from '~/routes/api+/documents+/upload';
import { useFetcherResponseHandler } from '~/hooks/useFetcherResponseHandler';

export default function DocumentUploader({
  multiple = true,
  handleDocumentUploaded,
  ...props
}: { handleDocumentUploaded: (document: IDocument[]) => void } & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'value'
>) {
  const fetcher = useFetcher<typeof action>();
  const [files, setFiles] = useState<FilePondFile[]>([]);

  useFetcherResponseHandler(fetcher, {
    onSuccess: (data) => data && handleDocumentUploaded(data),
  });

  return (
    <div
    // className={`flex gap-2 sm:gap-4 items-center justify-center h-full p-2 sm:p-4`}
    >
      {/* <label className='cursor-pointer flex flex-col w-full max-w-md items-center rounded-xl border-2 border-dashed border-blue-400 bg-white p-4 sm:p-6 text-center hover:border-blue-500 transition-colors'>
        <UploadCloud className='w-5 h-5 sm:w-6 sm:h-6 text-blue-400 m-auto' />

        <h2 className='text-lg sm:text-xl mt-1 sm:mt-2 font-medium text-gray-700 tracking-wide'>
          <span className='hidden sm:inline'>Upload Document</span>
          <span className='sm:hidden'>Tải lên</span>
        </h2>

        <p className='mt-1 sm:mt-2 text-sm sm:text-base text-gray-500 tracking-wide'>
          <span className='hidden sm:inline'>
            Upload your file SVG, PNG, JPG or GIF.
          </span>
          <span className='sm:hidden'>Chọn tệp để tải lên</span>
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
      </label> */}

      <FilePond
        files={files as any}
        onupdatefiles={setFiles}
        allowMultiple={true}
        maxFiles={3}
        server='/api'
        name='files' /* sets the file input name, it's filepond by default */
        labelIdle='Drag & Drop your files or <span class="filepond--label-action">Browse</span>'
      />
    </div>
  );
}

const toastUpdateOptions = {
  autoClose: 3000,
  isLoading: false,
};
