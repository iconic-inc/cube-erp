import { Card, CardContent } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { LucideIcon } from 'lucide-react';

interface EmployeeStatsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  iconClassName?: string;
}

export default function EmployeeStatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  iconClassName = 'bg-red-900/10',
}: EmployeeStatsCardProps) {
  return (
    <Card className='relative overflow-hidden'>
      <CardContent className='p-6'>
        <div className='flex items-center justify-between'>
          <div className='flex-1'>
            <p className='text-sm font-medium text-muted-foreground'>{title}</p>
            <p className='text-2xl font-bold text-foreground mt-1'>{value}</p>
            <p className='text-xs text-muted-foreground mt-1'>{description}</p>

            {trend && (
              <div className='flex items-center mt-2'>
                <Badge
                  variant={trend.isPositive ? 'default' : 'destructive'}
                  className='text-xs'
                >
                  {trend.isPositive ? '+' : ''}
                  {trend.value.toFixed(2)}%
                </Badge>
                <span className='text-xs text-muted-foreground ml-2'>
                  {trend.label}
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${iconClassName}`}>
            <Icon className='w-6 h-6 text-red-900' />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
