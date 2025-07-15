import { Card, CardContent } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  className?: string;
  iconClassName?: string;
}

export default function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className = '',
  iconClassName = '',
}: StatsCardProps) {
  return (
    <Card
      className={`hover:shadow-md transition-shadow duration-300 ${className}`}
    >
      <CardContent className='p-3 sm:p-4 md:p-6'>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex-1 space-y-1 sm:space-y-2 min-w-0'>
            <p className='text-xs sm:text-sm font-medium text-muted-foreground truncate'>
              {title}
            </p>
            <p className='text-lg sm:text-xl md:text-2xl font-bold tracking-tight truncate'>
              {value}
            </p>
            {description && (
              <p className='text-xs text-muted-foreground line-clamp-2 sm:line-clamp-none'>
                {description}
              </p>
            )}
            {trend && (
              <div className='flex items-center space-x-1 flex-wrap'>
                <Badge
                  variant={trend.isPositive ? 'default' : 'destructive'}
                  className='text-xs whitespace-nowrap'
                >
                  {trend.isPositive ? '+' : ''}
                  {trend.value}%
                </Badge>
                <span className='text-xs text-muted-foreground hidden sm:inline'>
                  {trend.label}
                </span>
              </div>
            )}
          </div>
          <div
            className={`h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full bg-red-900/10 flex items-center justify-center shrink-0 ${iconClassName}`}
          >
            <Icon className='h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-red-900' />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
