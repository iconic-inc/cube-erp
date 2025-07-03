import { Card, CardContent } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';

export default function DashboardSkeleton() {
  return (
    <div className='space-y-6'>
      {/* Header Skeleton */}
      <div className='flex items-center justify-between'>
        <Skeleton className='h-8 w-48' />
        <Skeleton className='h-10 w-32' />
      </div>

      {/* Stats Cards Skeleton */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div className='space-y-2 flex-1'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-8 w-16' />
                  <Skeleton className='h-3 w-32' />
                  <div className='flex items-center space-x-2'>
                    <Skeleton className='h-5 w-12' />
                    <Skeleton className='h-3 w-20' />
                  </div>
                </div>
                <Skeleton className='h-12 w-12 rounded-full' />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className='h-96'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between mb-4'>
                <Skeleton className='h-6 w-32' />
                <Skeleton className='h-8 w-20' />
              </div>
              <div className='space-y-4'>
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className='flex items-center space-x-4'>
                    <Skeleton className='h-10 w-10 rounded-full' />
                    <div className='flex-1 space-y-2'>
                      <Skeleton className='h-4 w-full' />
                      <Skeleton className='h-3 w-3/4' />
                    </div>
                    <Skeleton className='h-6 w-12' />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Stats Row Skeleton */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div className='space-y-2 flex-1'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-8 w-16' />
                  <Skeleton className='h-3 w-32' />
                </div>
                <Skeleton className='h-12 w-12 rounded-full' />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
