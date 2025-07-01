import { LoaderFunctionArgs } from '@remix-run/node';
import { Form, useLoaderData, useSearchParams } from '@remix-run/react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Calendar,
  FileText,
  PieChart,
  XCircle,
} from 'lucide-react';

import Defer from '~/components/Defer';
import { formatCurrency } from '~/utils';
import ContentHeader from '~/components/ContentHeader';
import { parseAuthCookie } from '~/services/cookie.server';
import { getTransactionStatistics } from '~/services/transaction.server';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Button } from '~/components/ui/button';
import StatisticsDisplay from './_components/StatisticsDisplay';
import { DatePicker } from '~/components/ui/date-picker';
import { TODAY } from '~/constants/date.constant';
import { getFirstWeekDate, getLastWeekDate } from '~/utils/date.util';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await parseAuthCookie(request);

  const url = new URL(request.url);

  const firstWeekDate = getFirstWeekDate(
    TODAY.getDay(),
    TODAY.getMonth(),
    TODAY.getFullYear(),
  );

  const startDate =
    url.searchParams.get('startDate') || firstWeekDate.toISOString();
  const endDate = url.searchParams.get('endDate') || TODAY.toISOString();
  const type = url.searchParams.get('type') || 'all';
  const paymentMethod = url.searchParams.get('paymentMethod') || '';

  // Build query for filtering
  const query: any = {};
  if (startDate) query.startDate = startDate;
  if (endDate) query.endDate = endDate;
  if (type) query.type = type;
  if (paymentMethod) query.paymentMethod = paymentMethod;

  return {
    statisticsPromise: getTransactionStatistics(query, user!).catch(
      (e: any) => {
        console.error(e);
        return {
          success: false,
          message:
            (e.message as string) || 'Có lỗi xảy ra khi lấy dữ liệu thống kê',
        };
      },
    ),
    filters: { startDate, endDate, type, paymentMethod },
  };
};

export default function TransactionReport() {
  const { statisticsPromise, filters } = useLoaderData<typeof loader>();

  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <div className='w-full space-y-6'>
      {/* Content Header */}
      <ContentHeader title='Báo cáo giao dịch' />

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center text-lg'>
            <Calendar className='h-5 w-5 mr-2' />
            Bộ lọc thời gian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form method='GET' className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='startDate'>Từ ngày</Label>
              <DatePicker
                id='startDate'
                initialDate={
                  filters.startDate ? new Date(filters.startDate) : null
                }
                name='startDate'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='endDate'>Đến ngày</Label>
              <DatePicker
                id='endDate'
                initialDate={filters.endDate ? new Date(filters.endDate) : null}
                name='endDate'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='type'>Loại giao dịch</Label>
              <Select
                // className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                defaultValue={filters.type}
                name='type'
              >
                <SelectTrigger>
                  <SelectValue placeholder='Loại giao dịch' />
                </SelectTrigger>

                <SelectContent>
                  <SelectGroup>
                    <SelectItem value='all'>Tất cả</SelectItem>
                    <SelectItem value='income'>Thu</SelectItem>
                    <SelectItem value='outcome'>Chi</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className='flex items-end gap-2'>
              <Button
                type='reset'
                className='w-full'
                variant='outline'
                onClick={() => {
                  setSearchParams({
                    startDate: '',
                    endDate: '',
                    type: 'all',
                  });
                }}
              >
                <XCircle className='h-4 w-4' />
                Đặt lại
              </Button>

              <Button type='submit' className='w-full'>
                Áp dụng
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {/* Async data loading with Suspense-like pattern */}
        <div className='col-span-full'>
          <Defer resolve={statisticsPromise}>
            {(data) => <StatisticsDisplay statisticsData={data} />}
          </Defer>
        </div>
      </div>
    </div>
  );
}
