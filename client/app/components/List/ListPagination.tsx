import { useSearchParams } from '@remix-run/react';
import { Button } from '~/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

export default function ListPagination({
  pagination,
  handleLimitChange,
  handlePageChange,
}: {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  handleLimitChange?: (newLimit: number) => void;
  handlePageChange?: (newPage: number) => void;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { page, limit } = pagination;

  const limitChangeHandler = (newLimit: number) => {
    if (handleLimitChange) {
      handleLimitChange(newLimit);
      return;
    }
    searchParams.set('page', '1'); // Reset to first page when limit changes
    searchParams.set('limit', newLimit.toString());
    setSearchParams(searchParams);
  };

  const pageChangeHandler = (newPage: number) => {
    if (handlePageChange) {
      handlePageChange(newPage);
      return;
    }
    if (newPage < 1 || newPage > pagination.totalPages) return; // Prevent invalid page numbers
    searchParams.set('page', newPage.toString());
    setSearchParams(searchParams);
  };

  return (
    <div className='px-3 sm:px-4 py-3 border-t border-gray-200 bg-white'>
      {/* Mobile Layout */}
      <div className='flex flex-col space-y-3 md:hidden'>
        {/* Results Info */}
        <div className='text-center'>
          <span className='text-xs sm:text-sm text-gray-700'>
            Hiển thị{' '}
            <span className='font-medium'>{(page - 1) * limit + 1}</span>-
            <span className='font-medium'>
              {Math.min(page * limit, pagination.total)}
            </span>{' '}
            trong <span className='font-medium'>{pagination.total}</span>
          </span>
        </div>

        {/* Page Controls */}
        <div className='flex items-center justify-between'>
          <Button
            onClick={() => pageChangeHandler(page - 1)}
            disabled={+page <= 1}
            variant='outline'
            size='sm'
            className='flex items-center gap-1'
          >
            <ChevronLeft className='w-4 h-4' />
            <span className='hidden sm:inline'>Trước</span>
          </Button>

          <div className='flex items-center space-x-1'>
            <span className='text-sm text-gray-700'>Trang</span>
            <span className='px-2 py-1 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded'>
              {page}
            </span>
            <span className='text-sm text-gray-700'>
              /{pagination.totalPages}
            </span>
          </div>

          <Button
            onClick={() => pageChangeHandler(page + 1)}
            disabled={+page >= pagination.totalPages}
            variant='outline'
            size='sm'
            className='flex items-center gap-1'
          >
            <span className='hidden sm:inline'>Sau</span>
            <ChevronRight className='w-4 h-4' />
          </Button>
        </div>

        {/* Items per page */}
        <div className='flex items-center justify-center space-x-2'>
          <span className='text-xs text-gray-700'>Hiển thị</span>
          <Select
            value={limit.toString()}
            onValueChange={(value) => limitChangeHandler(Number(value))}
          >
            <SelectTrigger className='w-16 h-8 text-xs'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='10'>10</SelectItem>
              <SelectItem value='25'>25</SelectItem>
              <SelectItem value='50'>50</SelectItem>
              <SelectItem value='100'>100</SelectItem>
              <SelectItem value='500'>500</SelectItem>
            </SelectContent>
          </Select>
          <span className='text-xs text-gray-700'>mỗi trang</span>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className='hidden md:flex items-center justify-between'>
        <div className='flex items-center space-x-2'>
          <span className='text-sm text-gray-700'>Hiển thị</span>
          <Select
            value={limit.toString()}
            onValueChange={(value) => limitChangeHandler(Number(value))}
          >
            <SelectTrigger className='w-20 h-9'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='10'>10</SelectItem>
              <SelectItem value='25'>25</SelectItem>
              <SelectItem value='50'>50</SelectItem>
              <SelectItem value='100'>100</SelectItem>
              <SelectItem value='500'>500</SelectItem>
            </SelectContent>
          </Select>
          <span className='text-sm text-gray-700'>mỗi trang</span>
        </div>

        <div className='flex items-center gap-4'>
          <span className='text-sm text-gray-700'>
            Hiển thị{' '}
            <span className='font-medium'>{(page - 1) * limit + 1}</span> đến{' '}
            <span className='font-medium'>
              {Math.min(page * limit, pagination.total)}
            </span>{' '}
            trong <span className='font-medium'>{pagination.total}</span> kết
            quả
          </span>

          <nav
            className='relative z-0 inline-flex rounded-md shadow-sm -space-x-px'
            aria-label='Pagination'
          >
            <Button
              onClick={() => pageChangeHandler(1)}
              disabled={+page <= 1}
              variant='outline'
              size='icon'
              className='rounded-none rounded-l-md'
            >
              <span className='sr-only'>First</span>
              <ChevronsLeft className='w-4 h-4' />
            </Button>

            <Button
              onClick={() => pageChangeHandler(page - 1)}
              disabled={+page <= 1}
              variant='outline'
              size='icon'
              className='rounded-none'
            >
              <span className='sr-only'>Previous</span>
              <ChevronLeft className='w-4 h-4' />
            </Button>

            {Array.from(
              { length: Math.min(5, pagination.totalPages) },
              (_, i) => {
                const pageNum = page > 3 ? page - 3 + i + 1 : i + 1;
                if (pageNum <= pagination.totalPages) {
                  return (
                    <Button
                      key={pageNum}
                      onClick={() => pageChangeHandler(pageNum)}
                      variant={pageNum === page ? 'default' : 'outline'}
                      size='icon'
                      className='rounded-none'
                      disabled={+pageNum === +page}
                    >
                      {pageNum}
                    </Button>
                  );
                }
                return null;
              },
            )}

            {page + 2 < pagination.totalPages && (
              <span className='border px-3 bg-gray-100'>...</span>
            )}

            {page + 2 < pagination.totalPages && (
              <Button
                onClick={() => pageChangeHandler(pagination.totalPages)}
                variant='outline'
                size='icon'
                className='rounded-none'
                disabled={+page >= +pagination.totalPages}
              >
                {pagination.totalPages}
              </Button>
            )}

            <Button
              onClick={() => pageChangeHandler(page + 1)}
              disabled={+page >= pagination.totalPages}
              variant='outline'
              size='icon'
              className='rounded-none'
            >
              <span className='sr-only'>Next</span>
              <ChevronRight className='w-4 h-4' />
            </Button>

            <Button
              onClick={() => pageChangeHandler(pagination.totalPages)}
              disabled={+page >= pagination.totalPages}
              variant='outline'
              size='icon'
              className='rounded-none rounded-r-md'
            >
              <span className='sr-only'>Last</span>
              <ChevronsRight className='w-4 h-4' />
            </Button>
          </nav>
        </div>
      </div>
    </div>
  );
}
