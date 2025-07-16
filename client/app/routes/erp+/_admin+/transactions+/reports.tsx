import { LoaderFunctionArgs } from '@remix-run/node';
import { Form, useLoaderData, useSearchParams } from '@remix-run/react';
import { Calendar, XCircle } from 'lucide-react';

import Defer from '~/components/Defer';
import ContentHeader from '~/components/ContentHeader';
import { parseAuthCookie } from '~/services/cookie.server';
import { getTransactionStatistics } from '~/services/transaction.server';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Label } from '~/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Button } from '~/components/ui/button';
import StatisticsDisplay from './_components/StatisticsDisplay';
import { DatePicker } from '~/components/ui/date-picker';
import { TODAY } from '~/constants/date.constant';
import { getFirstWeekDate, getLastWeekDate } from '~/utils/date.util';
import { canAccessTransactionManagement } from '~/utils/permission';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await parseAuthCookie(request);

  if (!canAccessTransactionManagement(user?.user.usr_role)) {
    throw new Response('Bạn không có quyền truy cập vào trang này.', {
      status: 403,
    });
  }

  const url = new URL(request.url);

  const firstWeekDate = getFirstWeekDate(
    TODAY.getDate(),
    TODAY.getMonth(),
    TODAY.getFullYear(),
  );

  const startDate =
    url.searchParams.get('startDate') || firstWeekDate.toISOString();
  const endDate =
    url.searchParams.get('endDate') || TODAY.addDays(1).toISOString();
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
    <div className='space-y-4 md:space-y-6 min-h-screen'>
      {/* Content Header */}
      <ContentHeader title='Báo cáo giao dịch' />

      {/* Filter Section */}
      <Card className='mx-2 sm:mx-0'>
        <CardHeader className='p-4 sm:p-6'>
          <CardTitle className='flex items-center text-base sm:text-lg'>
            <Calendar className='h-4 w-4 sm:h-5 sm:w-5 mr-2' />
            <span className='text-sm sm:text-lg'>Bộ lọc thời gian</span>
          </CardTitle>
        </CardHeader>
        <CardContent className='p-4 sm:p-6 pt-0'>
          <Form
            method='GET'
            className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'
          >
            <div className='space-y-2'>
              <Label htmlFor='startDate' className='text-sm sm:text-base'>
                Từ ngày
              </Label>
              <DatePicker
                id='startDate'
                initialDate={
                  filters.startDate ? new Date(filters.startDate) : null
                }
                name='startDate'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='endDate' className='text-sm sm:text-base'>
                Đến ngày
              </Label>
              <DatePicker
                id='endDate'
                initialDate={filters.endDate ? new Date(filters.endDate) : null}
                name='endDate'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='type' className='text-sm sm:text-base'>
                Loại giao dịch
              </Label>
              <Select
                // className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                defaultValue={filters.type}
                name='type'
              >
                <SelectTrigger className='text-sm sm:text-base'>
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

            <div className='flex flex-col sm:flex-row items-stretch sm:items-end gap-2 sm:gap-2'>
              <Button
                type='reset'
                className='w-full text-xs sm:text-sm'
                variant='outline'
                onClick={() => {
                  setSearchParams({
                    startDate: '',
                    endDate: '',
                    type: 'all',
                  });
                }}
              >
                <XCircle className='h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2' />
                <span className='hidden sm:inline'>Đặt lại</span>
                <span className='sm:hidden'>Reset</span>
              </Button>

              <Button type='submit' className='w-full text-xs sm:text-sm'>
                <span className='hidden sm:inline'>Áp dụng</span>
                <span className='sm:hidden'>Lọc</span>
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mx-2 sm:mx-0'>
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
