export default function EmployeeDashboardSkeleton() {
  return (
    <div className='space-y-4 md:space-y-6 min-h-screen'>
      {/* Header Skeleton */}
      <div className='flex items-center justify-between'>
        <div className='h-8 bg-gray-200 rounded w-64 animate-pulse'></div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
        {[...Array(4)].map((_, i) => (
          <div key={i} className='bg-white p-6 rounded-lg border'>
            <div className='flex items-center justify-between'>
              <div className='flex-1'>
                <div className='h-4 bg-gray-200 rounded w-24 animate-pulse mb-2'></div>
                <div className='h-8 bg-gray-200 rounded w-16 animate-pulse mb-2'></div>
                <div className='h-3 bg-gray-200 rounded w-32 animate-pulse'></div>
              </div>
              <div className='h-12 w-12 bg-gray-200 rounded-lg animate-pulse'></div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
        {[...Array(3)].map((_, i) => (
          <div key={i} className='bg-white p-6 rounded-lg border h-96'>
            <div className='flex items-center justify-between mb-4'>
              <div className='h-6 bg-gray-200 rounded w-32 animate-pulse'></div>
              <div className='h-8 bg-gray-200 rounded w-20 animate-pulse'></div>
            </div>
            <div className='space-y-4'>
              {[...Array(4)].map((_, j) => (
                <div key={j} className='flex items-center space-x-3'>
                  <div className='h-10 w-10 bg-gray-200 rounded animate-pulse'></div>
                  <div className='flex-1'>
                    <div className='h-4 bg-gray-200 rounded w-3/4 animate-pulse mb-2'></div>
                    <div className='h-3 bg-gray-200 rounded w-1/2 animate-pulse'></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Additional Stats Skeleton */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {[...Array(3)].map((_, i) => (
          <div key={i} className='bg-white p-6 rounded-lg border'>
            <div className='flex items-center justify-between'>
              <div className='flex-1'>
                <div className='h-4 bg-gray-200 rounded w-24 animate-pulse mb-2'></div>
                <div className='h-8 bg-gray-200 rounded w-16 animate-pulse mb-2'></div>
                <div className='h-3 bg-gray-200 rounded w-32 animate-pulse'></div>
              </div>
              <div className='h-12 w-12 bg-gray-200 rounded-lg animate-pulse'></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
