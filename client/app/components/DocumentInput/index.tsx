import { UploadCloud } from 'lucide-react';
import DocumentPicker from './DocumentPicker';
import { useState } from 'react';
import { IDocument } from '~/interfaces/document.interface';
import { IListResponse } from '~/interfaces/response.interface';

export default function DocumentInput({
  label,
  name,
  value,
  onChange,
  ...props
}: {
  name: string;
  label?: string;
  value: IDocument[];
  onChange: (value: IDocument[], ...args: any) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'>) {
  const [showPicker, setShowPicker] = useState(false);

  const handleOpenPicker = () => {
    setShowPicker(true);
  };

  const handleClosePicker = () => {
    setShowPicker(false);
  };

  const handleSelectDocument = (selectedDocuments: IDocument[]) => {
    onChange(selectedDocuments);
  };

  return (
    <div>
      {label && (
        <p className='block text-sm sm:text-sm font-semibold leading-6 text-black mb-2 sm:mb-4'>
          {label}
        </p>
      )}

      <div>
        <label
          className='flex cursor-pointer flex-col w-full items-center rounded-xl border-2 border-dashed border-blue-400 bg-white p-4 sm:p-6 text-center hover:border-blue-500 transition-colors'
          onClick={handleOpenPicker}
        >
          <UploadCloud className='w-5 h-5 sm:w-6 sm:h-6 text-blue-400' />

          <h2 className='text-lg sm:text-xl mt-1 sm:mt-2 font-medium text-gray-700 tracking-wide'>
            {label}
          </h2>

          <p className='mt-1 sm:mt-2 text-sm sm:text-sm text-gray-500 tracking-wide'>
            Tải lên các tài liệu của bạn tại đây.
          </p>
        </label>

        <input
          type='hidden'
          name={name}
          value={value.map((v) => v.id)}
          {...props}
        />
      </div>

      {showPicker && (
        <DocumentPicker
          documentGetter={async () => {
            const res = await fetch('/api/documents');
            if (!res.ok) {
              throw new Error('Failed to fetch documents');
            }
            const documents = await res.json();
            return documents as IListResponse<IDocument>;
          }}
          selected={Array.isArray(value) ? value : [value]}
          onClose={handleClosePicker}
          onSelect={handleSelectDocument}
        />
      )}
    </div>
  );
}
