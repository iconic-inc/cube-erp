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
      <CardContent className='p-6'>
        <div className='flex items-center justify-between'>
          <div className='space-y-2'>
            <p className='text-sm font-medium text-muted-foreground'>{title}</p>
            <p className='text-2xl font-bold tracking-tight'>{value}</p>
            {description && (
              <p className='text-xs text-muted-foreground'>{description}</p>
            )}
            {trend && (
              <div className='flex items-center space-x-1'>
                <Badge
                  variant={trend.isPositive ? 'default' : 'destructive'}
                  className='text-xs'
                >
                  {trend.isPositive ? '+' : ''}
                  {trend.value}%
                </Badge>
                <span className='text-xs text-muted-foreground'>
                  {trend.label}
                </span>
              </div>
            )}
          </div>
          <div
            className={`h-12 w-12 rounded-full bg-red-900/10 flex items-center justify-center ${iconClassName}`}
          >
            <Icon className='h-6 w-6 text-red-900' />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
