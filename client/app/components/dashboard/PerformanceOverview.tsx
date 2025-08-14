import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Progress } from '~/components/ui/progress';
import { Trophy, User, ArrowUpRight } from 'lucide-react';
import { Link } from '@remix-run/react';
import { IDashboardPerformance } from '~/services/dashboard.server';

interface PerformanceOverviewProps {
  performers: IDashboardPerformance[];
}

export default function PerformanceOverview({
  performers,
}: PerformanceOverviewProps) {
  return (
    <Card className='h-full'>
      <CardHeader className='pb-3 sm:pb-4'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-lg sm:text-xl font-bold flex items-center'>
            <Trophy className='w-4 h-4 sm:w-5 sm:h-5 mr-2 text-red-900' />
            <span className='hidden sm:inline'>Xếp hạng Nhân viên</span>
            <span className='sm:hidden'>Xếp hạng</span>
          </CardTitle>
          <Button variant='ghost' size='sm' asChild>
            <Link
              to='/erp/tasks/performance'
              className='flex items-center'
              prefetch='intent'
            >
              <span className='hidden sm:inline'>Xem tất cả</span>
              <span className='sm:hidden'>Xem</span>
              <ArrowUpRight className='w-4 h-4' />
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className='space-y-3 sm:space-y-4 p-3 sm:p-6'>
        {performers.length === 0 ? (
          <div className='text-center py-6 sm:py-8'>
            <User className='w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4' />
            <p className='text-sm sm:text-base text-muted-foreground'>
              Không có dữ liệu hiệu suất
            </p>
          </div>
        ) : (
          performers.map((performer, index) => (
            <div
              key={performer.employeeId}
              className='flex items-center space-x-2 sm:space-x-4 p-2 sm:p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors'
            >
              <div className='flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0'>
                <div className='relative shrink-0'>
                  <Avatar className='h-8 w-8 sm:h-10 sm:w-10'>
                    <AvatarImage
                      src={`/api/placeholder/40/40`}
                      alt={performer.employeeName}
                    />
                    <AvatarFallback className='bg-red-900/10 text-red-900 font-semibold text-xs sm:text-sm'>
                      {performer.employeeName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {index < 3 && (
                    <div
                      className={`absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        index === 0
                          ? 'bg-yellow-500'
                          : index === 1
                            ? 'bg-gray-400'
                            : 'bg-red-900'
                      }`}
                    >
                      {index + 1}
                    </div>
                  )}
                </div>

                <div className='flex-1 min-w-0'>
                  <div className='flex items-center justify-between mb-1'>
                    <p className='text-xs sm:text-sm font-medium text-foreground truncate'>
                      {performer.employeeName}
                    </p>
                    <Badge
                      variant='secondary'
                      className='text-xs shrink-0 ml-1'
                    >
                      {performer.performanceScore}/100
                    </Badge>
                  </div>

                  <div className='flex items-center space-x-1 sm:space-x-2 text-xs text-muted-foreground'>
                    <span className='truncate'>{performer.department}</span>
                    <span className='hidden sm:inline'>•</span>
                    <span className='hidden sm:inline truncate'>
                      {performer.position}
                    </span>
                  </div>

                  <div className='mt-1 sm:mt-2 space-y-1'>
                    <div className='flex justify-between text-xs'>
                      <span>Tỷ lệ hoàn thành</span>
                      <span>{performer.completionRate}%</span>
                    </div>
                    <Progress
                      value={performer.completionRate}
                      className='h-1'
                    />
                  </div>
                </div>
              </div>

              <div className='text-right shrink-0 ml-2'>
                <p className='text-xs sm:text-sm font-semibold'>
                  {performer.completedTasks}/{performer.totalTasks}
                </p>
                <p className='text-xs text-muted-foreground hidden sm:block'>
                  Công việc
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
