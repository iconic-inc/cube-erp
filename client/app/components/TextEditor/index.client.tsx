import { useEffect, useRef, useState } from 'react';
import Quill from 'quill';

import 'quill/dist/quill.snow.css';
import './index.css';
import { cn } from '~/lib/utils';

export default function TextEditorClient({
  value,
  onChange,
  name,
  placeholder,
  isReady = true,
  className = '',
}: {
  value: string;
  name: string;
  onChange: (value: string) => any;
  placeholder?: string;
  isReady?: boolean;
  className?: string;
}) {
  const quillRef = useRef<HTMLDivElement | null>(null);
  const [quill, setQuill] = useState<Quill | null>(null);
  const [length, setLength] = useState(0);

  useEffect(() => {
    if (quillRef.current && !quill && isReady) {
      const editor = document.createElement('div');
      quillRef.current.appendChild(editor);

      const quillInstance = new Quill(editor, {
        theme: 'snow', // or 'bubble'
        placeholder: placeholder || 'Nhập nội dung tại đây...',
        modules: {
          toolbar: {
            container: [
              [{ header: [1, 2, 3, 4, 5, false] }],
              ['bold', 'italic', 'underline'],
              [
                {
                  color: [
                    '#000000', // Black
                    '#212121', // Dark Gray (Primary Text)
                    '#757575', // Medium Gray (Secondary Text)
                    '#FFFFFF', // White
                    '#FF0000', // Red
                    '#D32F2F', // Error Red
                    '#008000', // Green
                    '#388E3C', // Success Green
                    '#0000FF', // Blue
                    '#1976D2', // Info Blue
                    '#FFFF00', // Yellow
                    '#F57C00', // Warning Orange
                    '#800080', // Purple
                    '#9333EA', // Purple-600
                    '#FFA500', // Orange
                    '#4682B4', // Steel Blue
                    '#008080', // Teal
                    '#000080', // Navy
                  ],
                },
                {
                  background: [
                    '#FFFFFF', // White
                    '#EEEEEE', // Gray
                    '#FFCDD2', // Red - stronger
                    '#C8E6C9', // Green - stronger
                    '#BBDEFB', // Blue - stronger
                    '#FFE0B2', // Orange/Amber - stronger
                    '#E1BEE7', // Purple - stronger
                    '#FFF9C4', // Yellow - stronger
                    '#D7CCC8', // Brown - light
                    '#B3E5FC', // Light Blue - stronger
                    '#F0F4C3', // Lime - stronger
                  ],
                },
              ],
              ['link', 'image'],
              [{ list: 'ordered' }, { list: 'bullet' }],
              ['clean'], // remove formatting
            ],
          },
        },
      });

      // Custom image upload handler
      (quillInstance.getModule('toolbar') as any).addHandler('image', () => {
        handleImageUpload(quillInstance); // Pass quillInstance directly
      });

      quillInstance.clipboard.dangerouslyPasteHTML(value);
      setLength(quillInstance.getLength() - 1);

      quillInstance.on('text-change', (delta) => {
        onChange(quillInstance.root.innerHTML);
        setLength(quillInstance.getLength() - 1);
      });
      setQuill(quillInstance);

      return () => {
        quillRef.current = document.createElement('div');
      };
    }
  }, [quillRef, quill, onChange, isReady]);

  // Custom image handler for Cloudinary
  const handleImageUpload = (quill: Quill) => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('name', 'img');
    input.setAttribute('accept', 'image/*');

    input.onchange = async () => {
      const file = input.files ? input.files[0] : null;
      if (file) {
        try {
          const range = quill.getSelection();
          const placeholderUrl = '/assets/loading.svg'; // Replace with your placeholder image URL

          // Save the placeholder position to replace it later
          const placeholderIndex = range?.index || 0;

          // Insert placeholder image at the current selection
          quill.insertEmbed(placeholderIndex, 'image', placeholderUrl);

          const formData = new FormData();
          formData.append('img', file);
          formData.append('folder', 'blog');

          const res = await fetch('/api/images/upload', {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();

          quill.deleteText(placeholderIndex, 1); // Remove placeholder

          // const altText = prompt('Enter alt text for the image:');
          const img = `<p><img src="${data.file.url}"/></p>`;

          quill.clipboard.dangerouslyPasteHTML(range?.index || 0, img);
        } catch (error) {
          console.error('Image upload failed:', error);
        }
      }
    };

    input.click();
  };

  return (
    <div id='quill-container' className={cn('flex flex-col h-full', className)}>
      {isReady ? (
        <div className='overflow-y-auto flex-1 flex flex-col' ref={quillRef} />
      ) : (
        <div className='flex-1 flex items-center justify-center border-x border-t border-zinc-300'>
          <span className='text-gray-500'>Đang tải trình soạn thảo...</span>
        </div>
      )}

      <input type='hidden' name={name} value={value} />
      <div className='border border-zinc-300 text-sm py-2 flex justify-between items-center px-4'>
        <span className='controls-right'>{length} ký tự</span>
      </div>
    </div>
  );
}
