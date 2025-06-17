import { useSearchParams } from '@remix-run/react';

export default function ListPagination({
  pagination,
}: {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { page, limit } = pagination;

  const handleLimitChange = (newLimit: number) => {
    searchParams.set('limit', newLimit.toString());
    setSearchParams(searchParams);
  };

  const handlePageChange = (newPage: number) => {
    searchParams.set('page', newPage.toString());
    setSearchParams(searchParams);
  };

  return (
    <div className='px-4 py-3 border-t border-gray-200 flex flex-col md:flex-row flex-wrap gap-3 md:gap-0 items-center justify-between'>
      <div className='flex items-center space-x-2'>
        <span className='text-sm text-gray-700'>Hiển thị</span>
        <select
          className='border border-gray-300 rounded-md text-sm py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
          value={limit}
          onChange={(e) => handleLimitChange(Number(e.target.value))}
        >
          <option value='10'>10</option>
          <option value='25'>25</option>
          <option value='50'>50</option>
          <option value='100'>100</option>
        </select>
        <span className='text-sm text-gray-700'>mỗi trang</span>
      </div>

      <div className='flex flex-col md:flex-row items-center gap-3 w-full md:w-auto justify-center md:justify-start'>
        <span className='text-sm text-gray-700 mb-2 md:mb-0 md:mr-4 text-center md:text-left'>
          Hiển thị <span className='font-medium'>{(page - 1) * limit + 1}</span>{' '}
          đến{' '}
          <span className='font-medium'>
            {Math.min(page * limit, pagination.total)}
          </span>{' '}
          trong <span className='font-medium'>{pagination.total}</span> kết quả
        </span>
        <nav
          className='relative z-0 inline-flex rounded-md shadow-sm -space-x-px overflow-x-auto pb-2 md:pb-0'
          aria-label='Pagination'
        >
          <button
            onClick={() => handlePageChange(1)}
            disabled={+page <= 1}
            className='relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <span className='sr-only'>First</span>
            <span className='material-symbols-outlined text-sm'>
              keyboard_double_arrow_left
            </span>
          </button>

          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={+page <= 1}
            className='relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:cursor-not-allowed'
          >
            <span className='sr-only'>Previous</span>
            <span className='material-symbols-outlined text-sm'>
              chevron_left
            </span>
          </button>

          {Array.from(
            { length: Math.min(5, pagination.totalPages) },
            (_, i) => {
              const pageNum = page > 3 ? page - 3 + i + 1 : i + 1;
              if (pageNum <= pagination.totalPages) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                      pageNum === page
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    disabled={+pageNum === +page}
                  >
                    {pageNum}
                  </button>
                );
              }
              return null;
            },
          )}

          {page + 2 < pagination.totalPages && (
            <span className='relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700'>
              ...
            </span>
          )}

          {page + 2 < pagination.totalPages && (
            <button
              onClick={() => handlePageChange(pagination.totalPages)}
              className='relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
              disabled={+page >= +pagination.totalPages}
            >
              {pagination.totalPages}
            </button>
          )}

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={+page >= pagination.totalPages}
            className='relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:cursor-not-allowed'
          >
            <span className='sr-only'>Next</span>
            <span className='material-symbols-outlined text-sm'>
              chevron_right
            </span>
          </button>

          <button
            onClick={() => handlePageChange(pagination.totalPages)}
            disabled={+page >= pagination.totalPages}
            className='relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:cursor-not-allowed'
          >
            <span className='sr-only'>Last</span>
            <span className='material-symbols-outlined text-sm'>
              keyboard_double_arrow_right
            </span>
          </button>
        </nav>
      </div>
    </div>
  );
}
