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
      className={`hover:shadow-lg hover:scale-[1.02] transition-all duration-300 hover:-translate-y-1 group ${className}`}
    >
      <CardContent className='p-3 sm:p-4 md:p-6'>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex-1 space-y-1 sm:space-y-2 min-w-0'>
            <p className='text-sm sm:text-base font-medium text-muted-foreground truncate transition-colors duration-200 group-hover:text-primary'>
              {title}
            </p>
            <p className='text-lg sm:text-xl md:text-2xl font-bold tracking-tight truncate transition-all duration-300 group-hover:text-primary group-hover:scale-105'>
              {value}
            </p>
            {description && (
              <p className='text-xs text-muted-foreground line-clamp-2 sm:line-clamp-none transition-colors duration-200 group-hover:text-gray-600'>
                {description}
              </p>
            )}
            {trend && (
              <div className='flex items-center space-x-1 flex-wrap animate-in slide-in-from-left-1 duration-300 delay-100'>
                <Badge
                  variant={trend.isPositive ? 'default' : 'destructive'}
                  className={`text-xs whitespace-nowrap transition-all duration-[500] hover:scale-110 ${
                    trend.isPositive ? 'animate-pulse' : ''
                  }`}
                >
                  {trend.isPositive ? '+' : ''}
                  {trend.value}%
                </Badge>
                <span className='text-xs text-muted-foreground hidden sm:inline transition-colors duration-200 group-hover:text-gray-600'>
                  {trend.label}
                </span>
              </div>
            )}
          </div>
          <div
            className={`h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full bg-red-900/10 flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:bg-red-900/20 animate-in scale-in-0 duration-400 delay-200 ${iconClassName}`}
          >
            <Icon className='h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-red-900 transition-all duration-300 group-hover:text-red-800 group-hover:scale-110' />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
