import { useEffect, useState } from 'react';

import { IDocument } from '~/interfaces/document.interface';
import { toVnDateString } from '~/utils';

export default function DocumentMetadata({
  document,
}: {
  document: IDocument;
}) {
  const [size, setSize] = useState(0);
  const [type, setType] = useState('document/jpeg');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const img = new Image();
        const res = await fetch(document.doc_url);
        if (!res.ok) {
          throw new Error('Failed to fetch document');
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        img.onload = () => {
          setSize(blob.size / 1024);
          setType(blob.type);
          setLoading(false);
        };
      } catch (error) {
        console.error('Error loading document metadata:', error);
        setSize(0);
        setType('document/jpeg');
        setLoading(false);
      }
    })();
  });

  return loading ? (
    <div className='bg-white rounded-lg p-4 animate-pulse'>
      <div className='w-2/3 h-4 bg-zinc-300 rounded mb-2'></div>
      <div className='w-full h-8 bg-zinc-300 rounded mb-2'></div>
      <div className='w-full h-8 bg-zinc-300 rounded mb-2'></div>
      <div className='w-1/2 h-8 bg-zinc-300 rounded'></div>
    </div>
  ) : (
    <div className='flex flex-col gap-2'>
      <p>
        <b>Đã tải lên lúc: </b>
        {toVnDateString(document.createdAt)}
      </p>

      <p className='truncate'>
        <b>Tên tệp tin: </b>
        {document.doc_name}
      </p>
      <p>
        <b>Đường dẫn: </b>
        <a
          href={document.doc_url}
          target='_blank'
          rel='noopener noreferrer'
          className='inline text-blue-500 hover:underline text-sm break-all'
        >
          {document.doc_url}
        </a>
      </p>
      <p>
        <b>Loại tệp tin: </b>
        {type}
      </p>
      <p>
        <b>Dung lượng tệp: </b>
        {size.toFixed(1)} KB
      </p>
    </div>
  );
}
