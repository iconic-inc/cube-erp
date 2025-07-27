import { Form, useFetcher, useSearchParams } from '@remix-run/react';
import {
  LoaderCircle,
  X,
  Search,
  Download,
  Columns,
  Upload,
} from 'lucide-react';
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
  importable = false,
  visibleColumns,
  setVisibleColumns,
  items,
}: {
  name: string;
  exportable?: boolean;
  importable?: boolean;
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
  const importFetcher = useFetcher<IActionFunctionResponse<any>>();
  const toastIdRef = useRef<any>(null);
  const importToastIdRef = useRef<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (importFetcher.data) {
      const response = importFetcher.data;
      if (response.success) {
        toast.update(importToastIdRef.current, {
          render: `Đã nhập dữ liệu ${name} thành công! ${response.data?.imported || 0} bản ghi được thêm, ${response.data?.updated || 0} bản ghi được cập nhật.`,
          type: response.toast.type,
          autoClose: 5000,
          isLoading: false,
        });

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // Refresh the page to show updated data
        window.location.reload();
      } else {
        const errorDetails = response.data?.errors?.length
          ? ` (${response.data.errors.length} lỗi)`
          : '';
        toast.update(importToastIdRef.current, {
          render:
            response.toast.message ||
            `Có lỗi xảy ra khi nhập dữ liệu ${name}${errorDetails}.`,
          type: 'error',
          autoClose: 5000,
          isLoading: false,
        });
      }
      setIsImporting(false);
    }
  }, [importFetcher.data]);

  const getFilterOptions = (column: IListColumn<T>) => {
    if (typeof column.options === 'function') {
      const options = items.data.map((item) =>
        JSON.stringify((column.options as (item: T) => any)(item)),
      );

      return Array.from(new Set(options)).map((item) => JSON.parse(item));
    }
    return column.options || [];
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Vui lòng chọn file Excel (.xlsx hoặc .xls)');
      event.target.value = '';
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('File quá lớn. Vui lòng chọn file nhỏ hơn 10MB');
      event.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('overwrite', 'false'); // Default to not overwrite

    setIsImporting(true);
    importToastIdRef.current = toast.loading(`Đang nhập dữ liệu ${name}...`);

    importFetcher.submit(formData, {
      method: 'POST',
      action: './import/xlsx',
      encType: 'multipart/form-data',
    });
  };

  return (
    <div className='p-3 sm:p-4 bg-gray-50 sm:bg-white space-y-3 sm:space-y-4'>
      {/* Search and Actions Row */}
      <div className='flex flex-col sm:flex-row gap-3 sm:gap-4'>
        {/* Search Form */}
        <Form
          method='GET'
          onSubmit={handleSearch}
          className='relative flex-1 max-w-none sm:max-w-md'
        >
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5' />
          <input
            type='text'
            placeholder='Tìm kiếm...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-full pl-8 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          />
        </Form>

        {/* Actions */}
        <div className='flex-1 flex items-center justify-end gap-2 sm:gap-3 flex-wrap'>
          {/* Import Button */}
          {importable && (
            <div className='flex-shrink-0'>
              <input
                ref={fileInputRef}
                type='file'
                accept='.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel'
                onChange={handleImportFile}
                className='hidden'
                disabled={isImporting}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className='px-3 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition shadow-sm flex items-center gap-1 sm:gap-2 whitespace-nowrap'
              >
                {isImporting ? (
                  <>
                    <LoaderCircle className='animate-spin w-4 h-4' />
                    <span className='hidden sm:inline'>Đang nhập...</span>
                    <span className='sm:hidden'>Nhập...</span>
                  </>
                ) : (
                  <>
                    <Upload className='w-4 h-4' />
                    <span className='hidden sm:inline'>Nhập Excel</span>
                    <span className='sm:hidden'>Nhập</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Export Button */}
          {exportable && (
            <exportFetcher.Form
              method='POST'
              className='flex-shrink-0'
              onSubmitCapture={(e) => {
                setIsExporting(true);
                toastIdRef.current = toast.loading(
                  `Đang xuất dữ liệu ${name}...`,
                );
              }}
            >
              <button
                className='px-3 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition shadow-sm flex items-center gap-1 sm:gap-2 whitespace-nowrap'
                name='fileType'
                value='xlsx'
              >
                {isExporting ? (
                  <>
                    <LoaderCircle className='animate-spin text-blue-500 w-4 h-4' />
                    <span className='hidden sm:inline'>
                      Đang xuất dữ liệu...
                    </span>
                    <span className='sm:hidden'>Đang xuất...</span>
                  </>
                ) : (
                  <>
                    <Download className='w-4 h-4' />
                    <span className='hidden sm:inline'>Xuất Excel</span>
                    <span className='sm:hidden'>Xuất</span>
                  </>
                )}
              </button>
            </exportFetcher.Form>
          )}

          {/* Column Visibility Toggle */}
          <details className='relative flex-shrink-0'>
            <summary className='px-3 py-2 bg-white border border-gray-300 rounded-md cursor-pointer flex items-center gap-1 sm:gap-2 hover:bg-gray-50 transition text-xs sm:text-sm whitespace-nowrap'>
              <Columns className='w-4 h-4' />
              <span className='hidden sm:inline'>Cột</span>
            </summary>
            <div className='absolute right-0 mt-2 w-48 sm:w-56 bg-white rounded-md shadow-lg border border-gray-200 z-10'>
              <div className='p-3 space-y-2 max-h-64 overflow-y-auto'>
                {visibleColumns.map(({ key, visible, title }) => (
                  <label key={key} className='flex items-center gap-2 text-sm'>
                    <input
                      type='checkbox'
                      checked={visible}
                      onChange={() => handleColumnVisibilityChange(key)}
                      className='rounded text-blue-500'
                    />
                    <span className='truncate'>{title}</span>
                  </label>
                ))}
              </div>
            </div>
          </details>
        </div>
      </div>

      {/* Filter Section */}
      {(filterableColumns.length > 0 || dateFilterableColumns.length > 0) && (
        <div className='w-full border-t border-gray-200 pt-3 sm:pt-4 mt-3 sm:mt-4'>
          <div className='flex flex-wrap gap-2 sm:gap-3 items-start sm:items-center'>
            <span className='text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap'>
              Bộ lọc:
            </span>

            <div className='flex flex-wrap gap-2 flex-1'>
              {filterableColumns.map((column) => (
                <div
                  key={column.key}
                  className='min-w-0 w-full sm:w-auto sm:min-w-48'
                >
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
                  className='flex flex-col sm:flex-row items-start sm:items-center gap-2 border border-gray-300 rounded-md p-2 bg-white w-full sm:w-auto'
                >
                  <span className='text-xs sm:text-sm text-gray-600 whitespace-nowrap'>
                    {column.title}:
                  </span>
                  <div className='flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto'>
                    <DatePicker
                      initialDate={activeDateFilters[column.filterField!]?.from}
                      onChange={(date) =>
                        handleDateFilterChange(
                          column.filterField!,
                          'from',
                          date,
                        )
                      }
                    />
                    <span className='text-xs sm:text-sm text-gray-500 self-center'>
                      đến
                    </span>
                    <DatePicker
                      initialDate={activeDateFilters[column.filterField!]?.to}
                      onChange={(date) =>
                        handleDateFilterChange(column.filterField!, 'to', date)
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            {(Object.keys(activeFilters).length > 0 ||
              Object.keys(activeDateFilters).length > 0) && (
              <Button
                variant='outline'
                className='px-2 py-1 text-xs text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50 transition-colors whitespace-nowrap flex-shrink-0'
                onClick={handleClearAllFilters}
              >
                <X className='w-3 h-3 sm:w-4 sm:h-4' />
                <span className='hidden sm:inline ml-1'>Xóa bộ lọc</span>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
