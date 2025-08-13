import { useFetcher } from '@remix-run/react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

export default function ListConfirmModal<T>({
  name,
  setShowDeleteModal,
  selectedItems,
  setSelectedItems,
  deleteHandleRoute,
}: {
  name: string;
  setShowDeleteModal: (show: boolean) => void;
  selectedItems: T[];
  setSelectedItems: (items: T[]) => void;
  deleteHandleRoute?: string;
}) {
  const bulkDeleteFetcher = useFetcher();
  const [isDeleting, setIsDeleting] = useState(false);
  const toastIdRef = useRef<any>(null);

  useEffect(() => {
    if (bulkDeleteFetcher.data) {
      setShowDeleteModal(false);
      const response = bulkDeleteFetcher.data as {
        success: boolean;
        toast: {
          type: 'success' | 'error';
          message: string;
        };
      };
      if (response.success) {
        toast.update(toastIdRef.current, {
          type: response.toast.type,
          render: `Đã xóa ${selectedItems.length} ${name} thành công!`,
          autoClose: 3000,
          isLoading: false,
        });
        setSelectedItems([]);
      } else {
        toast.update(toastIdRef.current, {
          type: 'error',
          render: response.toast.message || `Có lỗi xảy ra khi xóa ${name}.`,
          autoClose: 3000,
          isLoading: false,
        });
      }
      setIsDeleting(false);
    }
  }, [bulkDeleteFetcher.data]);

  const handleDelete = () => {
    setIsDeleting(true);
    toastIdRef.current = toast.loading(
      `Đang xóa ${selectedItems.length} ${name}...`,
    );
    const itemIds = selectedItems.map((item: any) => item.id);
    bulkDeleteFetcher.submit(
      { itemIds: JSON.stringify(itemIds) },
      { method: 'DELETE', action: deleteHandleRoute || '.' },
    );
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <bulkDeleteFetcher.Form
        method='DELETE'
        className='bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto'
      >
        <h3 className='text-lg font-bold mb-4'>Xác nhận xóa</h3>
        <p className='mb-6'>
          {selectedItems.length > 1
            ? `Bạn có chắc chắn muốn xóa ${selectedItems.length} ${name} này?`
            : `Bạn có chắc chắn muốn xóa ${name} này?`}
          Thao tác này không thể khôi phục.
        </p>

        <div className='flex justify-end gap-2'>
          <button
            className='px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition'
            onClick={() => setShowDeleteModal(false)}
            disabled={isDeleting}
            type='button'
          >
            Hủy
          </button>

          <button
            className='px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-md transition flex items-center gap-2'
            type='submit'
            onClick={() => handleDelete()}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <svg
                  className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                >
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'
                  ></circle>
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                  ></path>
                </svg>
                Đang xóa...
              </>
            ) : (
              'Xóa'
            )}
          </button>
        </div>
      </bulkDeleteFetcher.Form>
    </div>
  );
}
