import { Form, useFetcher, useSearchParams } from '@remix-run/react';
import { LoaderCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import {
  IActionFunctionResponse,
  IExportResponse,
  IListColumn,
} from '~/interfaces/app.interface';
// import { action } from '..';

export default function ListToolbar<T>({
  name,
  exportable = false,
  visibleColumns,
  setVisibleColumns,
}: {
  name: string;
  exportable?: boolean;
  visibleColumns: IListColumn<T>[];
  setVisibleColumns: (value: IListColumn<T>[]) => void;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get('search') || '',
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchTerm) {
      params.set('search', searchTerm);
    } else {
      params.delete('search');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  // Add a new handler for column visibility
  const handleColumnVisibilityChange = (columnKey: string) => {
    setVisibleColumns([
      ...visibleColumns.map((col) =>
        col.key === columnKey ? { ...col, visible: !col.visible } : col,
      ),
    ]);
  };

  const exportFetcher = useFetcher<IActionFunctionResponse<IExportResponse>>();
  const toastIdRef = useRef<any>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (exportFetcher.data) {
      const response = exportFetcher.data;
      if (response.success) {
        toast.update(toastIdRef.current, {
          render: `Đã xuất dữ liệu ${name} thành công!`,
          type: response.toast.type,
          autoClose: 3000,
          isLoading: false,
        });

        if (response.data?.fileUrl) {
          const link = document.createElement('a');
          link.href = response.data.fileUrl;
          link.download = response.data.fileName || 'customers';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        toast.update(toastIdRef.current, {
          render:
            response.toast.message || `Có lỗi xảy ra khi xuất dữ liệu ${name}.`,
          type: 'error',
          autoClose: 3000,
          isLoading: false,
        });
      }
      setIsExporting(false);
    }
  }, [exportFetcher.data]);

  return (
    <div className='p-4 border-b border-gray-200 flex flex-col md:flex-row md:flex-wrap gap-3 items-start md:items-center justify-between'>
      <Form
        method='GET'
        onSubmit={handleSearch}
        className='relative w-full md:flex-grow md:max-w-md'
      >
        <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined'>
          search
        </span>
        <input
          type='text'
          placeholder='Tìm kiếm...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
        />
      </Form>
      <div></div>

      <div className='flex items-center gap-3 w-full md:w-auto mt-3 md:mt-0'>
        {exportable && (
          <exportFetcher.Form
            method='POST'
            className='flex gap-3'
            onSubmitCapture={(e) => {
              setIsExporting(true);
              toastIdRef.current = toast.loading(
                `Đang xuất dữ liệu ${name}...`,
              );
            }}
          >
            <button
              className='px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition shadow-sm flex items-center gap-1'
              name='fileType'
              value='xlsx'
            >
              {isExporting ? (
                <>
                  <LoaderCircle className='animate-spin text-blue-500' />
                  Đang xuất dữ liệu...
                </>
              ) : (
                <>
                  <span className='material-symbols-outlined text-sm'>
                    download
                  </span>
                  Xuất Excel
                </>
              )}
            </button>
          </exportFetcher.Form>
        )}

        {/* Select attributes to display */}
        <details className='relative'>
          <summary className='px-3 py-2 bg-white border border-gray-300 rounded-md cursor-pointer flex items-center gap-2 hover:bg-gray-50 transition'>
            <span className='material-symbols-outlined text-sm'>
              view_column
            </span>
            <span>Cột</span>
          </summary>
          <div className='absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-10'>
            <div className='p-3 space-y-2'>
              {visibleColumns.map(({ key, visible, title }) => (
                <label key={key} className='flex items-center gap-2'>
                  <input
                    type='checkbox'
                    checked={visible}
                    onChange={() => handleColumnVisibilityChange(key)}
                    className='rounded text-blue-500'
                  />
                  <span>{title}</span>
                </label>
              ))}
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
