import React, { useEffect, useRef, useState } from 'react';
import ImagePreview from '../ImagePreview';
import { IImage } from '~/interfaces/image.interface';
import ImageUploader from './ImageUploader';
import ImageMetadata from './ImageMetadata';
import { useFetcher } from '@remix-run/react';
import { toast } from 'react-toastify';
import { action } from '~/routes/cmsdesk+/images+/$id';

interface ImagePickerProps {
  multiple?: boolean;
  selected?: IImage[];
  defaultActiveTab?: number;
  onClose: () => void;
  onSelect: (selectedImages: IImage[]) => void;
}

export default function ImagePicker({
  selected = [],
  multiple = false,
  defaultActiveTab = 2,
  onClose,
  onSelect,
}: ImagePickerProps) {
  const [images, setImages] = useState<IImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<IImage[]>(selected);
  const [activeTab, setActiveTab] = useState(defaultActiveTab);

  const handleImageClick = (id: string) => {
    if (multiple) {
      setSelectedImages((prev) => {
        const res = prev.find((img) => img.id === id)
          ? prev.filter((img) => img.id !== id) // Deselect if already selected
          : [...prev, images.find((img) => img.id === id)!]; // Add to selection

        return res;
      });
    } else {
      setSelectedImages((prev) =>
        prev.find((img) => img.id === id)
          ? [{} as IImage] // Deselect if already selected
          : [images.find((img) => img.id === id)!],
      ); // Allow only one selection
    }
  };

  const handleConfirm = () => {
    onSelect(selectedImages);
    onClose();
  };

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/data?getter=getImages');
      const images = (await res.json()) as IImage[];

      setImages(images);
    })();

    const escapeHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', escapeHandler);

    return () => {
      document.removeEventListener('keydown', escapeHandler);
    };
  }, []);

  const fetcher = useFetcher<typeof action>();
  const toastIdRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    switch (fetcher.state) {
      case 'submitting':
        toastIdRef.current = toast.loading('Loading...', {
          autoClose: false,
        });
        setLoading(true);
        break;

      case 'loading':
        if (fetcher.data?.toast && toastIdRef.current) {
          const { toast: toastData } = fetcher.data;
          toast.update(toastIdRef.current, {
            render: toastData.message,
            type: toastData.type || ('success' as any), // Default to 'success' if type is not provided
            autoClose: 3000,
            isLoading: false,
          });
          toastIdRef.current = null;
          setLoading(false);

          if (toastData.type === 'success') {
            if (fetcher.formMethod === 'DELETE') {
              setSelectedImages((prev) =>
                prev.filter((img) => img.id !== fetcher.data?.imageId),
              );
              setImages((prev) =>
                prev.filter((img) => img.id !== fetcher.data?.imageId),
              );
            }
          }

          break;
        }

        break;
    }
  }, [fetcher.state]);

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-8 z-50'>
      <div className='flex flex-col bg-white gap-4 p-6 rounded-lg shadow-lg w-full h-full overflow-y-auto'>
        <div className='flex-grow grid grid-cols-12 divide-x divide-zinc-200 gap-4'>
          <div
            className={`${
              activeTab === 1 ? 'col-span-12' : 'col-span-9'
            } flex-grow w-full h-full divide-y divide-zinc-200 transition-all`}
          >
            <div className='w-full flex gap-4 px-4'>
              <button
                className={`-mb-[1px] rounded-t px-2 py-1 border-zinc-200 ${
                  activeTab === 1 ? 'border border-b-white' : ''
                }`}
                onClick={() => setActiveTab(1)}
                type='button'
              >
                Tải lên tệp mới
              </button>
              <button
                className={`-mb-[1px] rounded-t px-2 py-1 border-zinc-200 ${
                  activeTab === 2 ? 'border border-b-white' : ''
                }`}
                onClick={() => setActiveTab(2)}
                type='button'
              >
                Chọn từ thư viện Media
              </button>
            </div>

            {activeTab === 1 && (
              <ImageUploader
                handleImageUploaded={(images) => {
                  setImages((prev) => [...prev, ...images]);
                  if (multiple)
                    setSelectedImages((prev) => [...prev, ...images]);
                  else setSelectedImages([images[0]]);

                  setActiveTab(2);
                }}
              />
            )}
            {activeTab === 2 && (
              <div className='grid grid-cols-8 gap-4 pt-4'>
                {images.map((image, index) => (
                  <div
                    key={index}
                    className={`border-2 rounded-lg aspect-square cursor-pointer flex justify-center items-center transition-all ${
                      selectedImages.find((img) => img?.id === image?.id)
                        ? 'border-blue-500'
                        : 'border-gray-300'
                    } overflow-hidden`}
                    onClick={() => handleImageClick(image.id)}
                  >
                    <img
                      src={image.img_url}
                      alt={image.img_title}
                      className=''
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {activeTab === 1 || (
            <div className='col-span-3 h-full pl-4 flex flex-col gap-4'>
              <ImagePreview src={selectedImages[0]?.img_url} />
              <ImageMetadata
                image={
                  images.find((img) => img.id === selectedImages[0]?.id) ||
                  ({} as any)
                }
              />
            </div>
          )}
        </div>

        <div className='h-fit flex justify-between'>
          <div className='flex gap-4'>
            <button
              onClick={onClose}
              className='bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition'
              type='button'
            >
              Hủy bỏ
            </button>

            {selectedImages.length > 0 && (
              <button
                onClick={() => {
                  selectedImages.map((img) =>
                    fetcher.submit(null, {
                      method: 'DELETE',
                      action: `/cmsdesk/images/${img.id}`,
                    }),
                  );
                }}
                disabled={loading}
                className='bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition'
                type='button'
                title='Xóa ảnh đã chọn'
                aria-label='Xóa ảnh đã chọn'
              >
                {multiple ? 'Xóa tất cả' : 'Xóa ảnh'}
              </button>
            )}
          </div>

          <button
            onClick={handleConfirm}
            disabled={loading}
            className='bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition'
            type='button'
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
