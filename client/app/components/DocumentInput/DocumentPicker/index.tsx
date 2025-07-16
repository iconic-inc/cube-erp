import { useEffect, useRef, useState } from 'react';
import { IDocument } from '~/interfaces/document.interface';
import DocumentUploader from './DocumentUploader';
import { useFetcher } from '@remix-run/react';
import { toast } from 'react-toastify';
import { action } from '~/routes/api+/documents+/upload';
import { IListResponse } from '~/interfaces/response.interface';
import ItemList from '~/components/List/ItemList';
import LoadingCard from '~/components/LoadingCard';
import ErrorCard from '~/components/ErrorCard';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';

interface DocumentPickerProps {
  selected?: IDocument[];
  defaultActiveTab?: number;
  onClose: () => void;
  onSelect: (selectedDocuments: IDocument[]) => void;
  documentGetter: () => Promise<IListResponse<IDocument>>;
}

export default function DocumentPicker({
  selected = [],
  defaultActiveTab = 2,
  onClose,
  onSelect,
  documentGetter,
}: DocumentPickerProps) {
  const [documents, setDocuments] = useState<IListResponse<IDocument>>({
    data: [],
    pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocuments, setSelectedDocuments] =
    useState<IDocument[]>(selected);
  const [activeTab, setActiveTab] = useState(defaultActiveTab);

  const handleDocumentClick = (id: string) => {
    setSelectedDocuments((prev) => {
      const res = prev.find((doc) => doc.id === id)
        ? prev.filter((doc) => doc.id !== id) // Deselect if already selected
        : [...prev, documents.data.find((doc) => doc.id === id)!]; // Add to selection

      return res;
    });
  };

  const handleConfirm = () => {
    onSelect(selectedDocuments);
    onClose();
  };

  useEffect(() => {
    (async () => {
      try {
        const documents = await documentGetter();

        setDocuments(documents);
      } catch (error: any) {
        console.error('Error fetching documents:', error);
        setError(error.message || 'Có lỗi xảy ra khi tải tài liệu');
      }
      setIsLoading(false);
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
  const [searchTerm, setSearchTerm] = useState('');
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
              setDocuments((prev) => ({
                ...prev,
                data: prev.data.filter(
                  (doc) => !selectedDocuments.some((d) => d.id === doc.id),
                ),
              }));
              setSelectedDocuments([]);
            }
          }

          break;
        }

        break;
    }
  }, [fetcher.state]);

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-2 sm:p-4 lg:p-8 z-50'>
      <div className='flex flex-col bg-white gap-3 sm:gap-4 p-3 sm:p-4 lg:p-6 rounded-lg shadow-lg w-full h-full max-w-7xl max-h-[95vh] overflow-hidden'>
        <div className='flex-grow grid grid-cols-12 divide-x divide-zinc-200 gap-2 sm:gap-4 overflow-hidden'>
          <div
            className={`col-span-12 flex-grow w-full h-full divide-y divide-zinc-200 transition-all flex flex-col overflow-hidden`}
          >
            <div className='w-full flex gap-2 sm:gap-4 px-2 sm:px-4 flex-shrink-0'>
              <button
                className={`-mb-[1px] rounded-t px-2 py-1 border-zinc-200 text-sm sm:text-base ${
                  activeTab === 1 ? 'border border-b-white' : ''
                }`}
                onClick={() => setActiveTab(1)}
                type='button'
              >
                <span className='hidden sm:inline'>Tải lên tệp mới</span>
                <span className='sm:hidden'>Tải lên</span>
              </button>
              <button
                className={`-mb-[1px] rounded-t px-2 py-1 border-zinc-200 text-sm sm:text-base ${
                  activeTab === 2 ? 'border border-b-white' : ''
                }`}
                onClick={() => setActiveTab(2)}
                type='button'
              >
                <span className='hidden sm:inline'>
                  Chọn từ thư viện tài liệu
                </span>
                <span className='sm:hidden'>Thư viện</span>
              </button>
            </div>

            {activeTab === 1 && (
              <DocumentUploader
                handleDocumentUploaded={(documents) => {
                  setDocuments((prev) => ({
                    ...prev,
                    data: [...prev.data, ...documents],
                  }));

                  setSelectedDocuments((prev) => [...prev, ...documents]);

                  setActiveTab(2);
                }}
              />
            )}

            {isLoading && <LoadingCard />}
            {error && <ErrorCard message={error} />}
            {activeTab === 2 && !error && !isLoading && (
              <div className='flex flex-col overflow-hidden flex-grow'>
                <div className='p-2 sm:p-4 border-b border-gray-200 flex flex-col gap-2 sm:gap-3 flex-shrink-0'>
                  <div className='relative w-full'>
                    <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-sm sm:text-base'>
                      search
                    </span>
                    <input
                      type='text'
                      placeholder='Tìm kiếm...'
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className='w-full pl-8 sm:pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base'
                    />
                  </div>
                </div>

                <div className='flex-grow overflow-auto'>
                  <ItemList<IDocument>
                    itemsPromise={{
                      data: documents.data.filter((doc) =>
                        doc.doc_name
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase()),
                      ),
                      pagination: documents.pagination,
                    }}
                    addNewHandler={() => setActiveTab(1)}
                    name='Tài liệu'
                    selectedItems={selectedDocuments}
                    setSelectedItems={setSelectedDocuments}
                    visibleColumns={[
                      {
                        key: 'name',
                        title: 'Tên tài liệu',
                        visible: true,
                        render: (doc) => (
                          <span className='text-xs sm:text-sm font-medium text-gray-800 break-words'>
                            {doc.doc_name}
                          </span>
                        ),
                      },
                      {
                        key: 'createdBy',
                        title: 'Người tạo',
                        visible: true,
                        render: (doc) => (
                          <span className='text-xs sm:text-sm text-gray-600 break-words'>
                            {`${doc.doc_createdBy.emp_user?.usr_firstName} ${doc.doc_createdBy.emp_user?.usr_lastName}`}
                          </span>
                        ),
                      },
                      {
                        key: 'isPublic',
                        title: 'Chế độ truy cập',
                        visible: true,
                        render: (doc) => (
                          <Badge
                            className={`${doc.doc_isPublic ? 'bg-green-500' : 'bg-yellow-500'} text-white text-xs`}
                          >
                            <span className=''>
                              {doc.doc_isPublic ? 'Công khai' : 'Hạn chế'}
                            </span>
                          </Badge>
                        ),
                      },
                      {
                        key: 'actions',
                        title: 'Hành động',
                        visible: true,
                        render: (doc) => (
                          <Button
                            onClick={() => handleDocumentClick(doc.id)}
                            variant={
                              selectedDocuments.find((d) => d.id === doc.id)
                                ? 'destructive'
                                : 'primary'
                            }
                            size='sm'
                            className='text-xs sm:text-sm'
                          >
                            <span className='hidden sm:inline'>
                              {selectedDocuments.find((d) => d.id === doc.id)
                                ? 'Bỏ chọn'
                                : 'Chọn'}
                            </span>
                            <span className='sm:hidden'>
                              {selectedDocuments.find((d) => d.id === doc.id)
                                ? 'Bỏ'
                                : 'Chọn'}
                            </span>
                          </Button>
                        ),
                      },
                    ]}
                    showPagination={false}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className='h-fit flex flex-col sm:flex-row justify-between gap-2 sm:gap-4 flex-shrink-0'>
          <div className='flex flex-col sm:flex-row gap-2 sm:gap-4'>
            <Button
              onClick={onClose}
              variant='secondary'
              type='button'
              size='sm'
              className='w-full sm:w-auto'
            >
              Hủy bỏ
            </Button>

            {selectedDocuments.length > 0 && (
              <Button
                variant='destructive'
                onClick={() => {
                  fetcher.submit(
                    {
                      itemIds: JSON.stringify(
                        selectedDocuments.map((doc) => doc.id),
                      ),
                    },
                    {
                      method: 'DELETE',
                      action: `/erp/documents`,
                    },
                  );
                }}
                disabled={loading}
                type='button'
                size='sm'
                className='w-full sm:w-auto'
                title='Xóa tài liệu đã chọn'
                aria-label='Xóa tài liệu đã chọn'
              >
                <span className='hidden sm:inline'>Xóa Tài liệu đã chọn</span>
                <span className='sm:hidden'>Xóa đã chọn</span>
              </Button>
            )}
          </div>

          <Button
            onClick={handleConfirm}
            disabled={loading}
            variant='primary'
            size='sm'
            className='w-full sm:w-auto'
            type='button'
          >
            Xác nhận
          </Button>
        </div>
      </div>
    </div>
  );
}
