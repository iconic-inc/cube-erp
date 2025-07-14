import { Form, useFetcher, useSearchParams } from '@remix-run/react';
import { LoaderCircle, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import {
  IActionFunctionResponse,
  IExportResponse,
  IListColumn,
  ILoaderDataPromise,
} from '~/interfaces/app.interface';
import { Button } from '../ui/button';
import { SelectSearch } from '../ui/SelectSearch';
import { DatePicker } from '../ui/date-picker';
import { IListResponse } from '~/interfaces/response.interface';

export default function ListToolbar<T>({
  name,
  exportable = false,
  visibleColumns,
  setVisibleColumns,
  items,
}: {
  name: string;
  exportable?: boolean;
  visibleColumns: IListColumn<T>[];
  setVisibleColumns: (value: IListColumn<T>[]) => void;
  items: IListResponse<T>;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get('search') || '',
  );

  // State for active filters
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>(
    () => {
      const filters: Record<string, string> = {};
      visibleColumns.forEach((col) => {
        if (col.filterField) {
          const filterValue = searchParams.get(col.filterField);
          if (filterValue) {
            filters[col.filterField] = filterValue;
          }
        }
      });
      return filters;
    },
  );

  // State for date filters
  const [activeDateFilters, setActiveDateFilters] = useState<
    Record<string, { from?: Date; to?: Date }>
  >(() => {
    const dateFilters: Record<string, { from?: Date; to?: Date }> = {};
    visibleColumns.forEach((col) => {
      if (col.dateFilterable && col.filterField) {
        const fromValue = searchParams.get(`${col.filterField}From`);
        const toValue = searchParams.get(`${col.filterField}To`);
        if (fromValue || toValue) {
          dateFilters[col.filterField] = {
            from: fromValue ? new Date(fromValue) : undefined,
            to: toValue ? new Date(toValue) : undefined,
          };
        }
      }
    });
    return dateFilters;
  });

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

  // Handler for filter changes
  const handleFilterChange = (filterField: string, value: string) => {
    const params = new URLSearchParams(searchParams);

    if (value && value !== '') {
      params.set(filterField, value);
      setActiveFilters((prev) => ({ ...prev, [filterField]: value }));
    } else {
      params.delete(filterField);
      setActiveFilters((prev) => {
        const newFilters = { ...prev };
        delete newFilters[filterField];
        return newFilters;
      });
    }

    params.set('page', '1');
    setSearchParams(params);
  };

  // Handler for date filter changes
  const handleDateFilterChange = (
    filterField: string,
    type: 'from' | 'to',
    date: Date | undefined,
  ) => {
    const params = new URLSearchParams(searchParams);

    if (date) {
      params.set(
        `${filterField}${type === 'from' ? 'From' : 'To'}`,
        date.toISOString(),
      );
    } else {
      params.delete(`${filterField}${type === 'from' ? 'From' : 'To'}`);
    }

    setActiveDateFilters((prev) => ({
      ...prev,
      [filterField]: {
        ...prev[filterField],
        [type]: date,
      },
    }));

    params.set('page', '1');
    setSearchParams(params);
  };

  // Handler to clear all filters
  const handleClearAllFilters = () => {
    const params = new URLSearchParams(searchParams);

    // Remove all filter parameters
    filterableColumns.forEach((col) => {
      if (col.filterField) {
        params.delete(col.filterField);
      }
    });

    // Remove all date filter parameters
    dateFilterableColumns.forEach((col) => {
      if (col.filterField) {
        params.delete(`${col.filterField}From`);
        params.delete(`${col.filterField}To`);
      }
    });

    params.set('page', '1');
    setActiveFilters({});
    setActiveDateFilters({});
    setSearchParams(params);
  };

  // Get filterable columns
  const filterableColumns = visibleColumns.filter(
    (col) => col.filterField && col.options,
  );
  const dateFilterableColumns = visibleColumns.filter(
    (col) => col.dateFilterable && col.filterField,
  );

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

  // Sync activeFilters with URL params
  useEffect(() => {
    const filters: Record<string, string> = {};
    const dateFilters: Record<string, { from?: Date; to?: Date }> = {};

    visibleColumns.forEach((col) => {
      if (col.filterField) {
        const filterValue = searchParams.get(col.filterField);
        if (filterValue) {
          filters[col.filterField] = filterValue;
        }
      }

      if (col.dateFilterable && col.filterField) {
        const fromValue = searchParams.get(`${col.filterField}From`);
        const toValue = searchParams.get(`${col.filterField}To`);
        if (fromValue || toValue) {
          dateFilters[col.filterField] = {
            from: fromValue ? new Date(fromValue) : undefined,
            to: toValue ? new Date(toValue) : undefined,
          };
        }
      }
    });

    setActiveFilters(filters);
    setActiveDateFilters(dateFilters);
  }, [searchParams, visibleColumns]);

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

  const getFilterOptions = (column: IListColumn<T>) => {
    if (typeof column.options === 'function') {
      const options = items.data.map((item) =>
        JSON.stringify((column.options as (item: T) => any)(item)),
      );

      return Array.from(new Set(options)).map((item) => JSON.parse(item));
    }
    return column.options || [];
  };

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
      {/* <div></div> */}

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

      {/* Filter Section */}
      {(filterableColumns.length > 0 || dateFilterableColumns.length > 0) && (
        <div className='w-full'>
          <div className='flex flex-wrap gap-2 items-center'>
            <span className='text-sm font-medium text-gray-700'>Bộ lọc:</span>

            {filterableColumns.map((column) => (
              <div key={column.key} className='relative min-w-48'>
                <SelectSearch
                  options={[
                    { label: `Tất cả ${column.title}`, value: '' },
                    ...getFilterOptions(column),
                  ]}
                  value={activeFilters[column.filterField!] || ''}
                  onValueChange={(value) =>
                    handleFilterChange(column.filterField!, value)
                  }
                  placeholder={`Chọn ${column.title}...`}
                />
              </div>
            ))}

            {dateFilterableColumns.map((column) => (
              <div
                key={`${column.key}-date`}
                className='flex items-center gap-2 border border-gray-300 rounded-md p-2 bg-white'
              >
                <span className='text-sm text-gray-600 whitespace-nowrap'>
                  {column.title}:
                </span>
                <div className='flex items-center gap-2'>
                  <DatePicker
                    initialDate={activeDateFilters[column.filterField!]?.from}
                    onChange={(date) =>
                      handleDateFilterChange(column.filterField!, 'from', date)
                    }
                  />
                  <span className='text-sm text-gray-500'>đến</span>
                  <DatePicker
                    initialDate={activeDateFilters[column.filterField!]?.to}
                    onChange={(date) =>
                      handleDateFilterChange(column.filterField!, 'to', date)
                    }
                  />
                </div>
              </div>
            ))}

            {(Object.keys(activeFilters).length > 0 ||
              Object.keys(activeDateFilters).length > 0) && (
              <Button
                variant='outline'
                className='px-2 py-1 text-xs text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50 transition-colors'
                onClick={handleClearAllFilters}
              >
                <X />
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
