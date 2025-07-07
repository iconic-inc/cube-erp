import {
  CreditCard,
  DollarSign,
  FileText,
  PieChart as PieChartIcon,
  TrendingDown,
  TrendingUp,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '~/components/ui/chart';
import { Line, LineChart, Pie, XAxis, YAxis, PieChart, Cell } from 'recharts';
import { ITransactionStats } from '~/interfaces/transaction.interface';
import { formatCurrency } from '~/utils';
import { TRANSACTION } from '~/constants/transaction.constant';

export default function StatisticsDisplay({
  statisticsData,
}: {
  statisticsData: ITransactionStats;
}) {
  const stats = statisticsData;

  // Chart configurations
  const chartConfig = {
    income: {
      label: 'Thu nhập',
      color: 'hsl(var(--chart-1))',
    },
    outcome: {
      label: 'Chi tiêu',
      color: 'hsl(var(--chart-2))',
    },
    total: {
      label: 'Tổng',
      color: 'hsl(var(--chart-3))',
    },
    net: {
      label: 'Lãi/Lỗ',
      color: 'hsl(var(--chart-4))',
    },
  };

  const incomeByCategory = stats.byCategory?.reduce(
    (acc, category) => {
      if (category.income <= 0) return acc;
      const cat = Object.values(TRANSACTION.CATEGORY.income).find(
        (cat) => cat.value === category.category,
      );
      if (cat) {
        acc.push({
          category: cat.label,
          income: category.income || 0,
          fill: `hsl(${(acc.length * 137.5) % 360}, 70%, 50%)`,
        });
      }
      return acc;
    },
    [] as {
      category: string;
      income: number;
      fill: string;
    }[],
  );
  const outcomeByCategory = stats.byCategory?.reduce(
    (acc, category) => {
      if (category.outcome <= 0) return acc;
      const cat = Object.values(TRANSACTION.CATEGORY.outcome).find(
        (cat) => cat.value === category.category,
      );
      if (cat) {
        acc.push({
          category: cat.label,
          outcome: category.outcome || 0,
          fill: `hsl(${(acc.length * 137.5 + 60) % 360}, 70%, 50%)`,
        });
      }
      return acc;
    },
    [] as {
      category: string;
      outcome: number;
      fill: string;
    }[],
  );

  const monthlyChartData =
    stats.byDay?.slice(-30).map((day) => ({
      date: day.date,
      income: day.income || 0,
      outcome: day.outcome || 0,
      net: day.net || 0,
      count: day.count || 0,
    })) || [];

  return (
    <>
      {/* Overview Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Tổng thu</p>
                <p className='text-2xl font-bold text-green-600'>
                  {formatCurrency(stats.totalIncome || 0)}
                </p>
              </div>
              <div className='h-12 w-12 bg-green-100 rounded-full flex items-center justify-center'>
                <TrendingUp className='h-6 w-6 text-green-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Tổng chi</p>
                <p className='text-2xl font-bold text-red-600'>
                  {formatCurrency(stats.totalOutcome || 0)}
                </p>
              </div>
              <div className='h-12 w-12 bg-red-100 rounded-full flex items-center justify-center'>
                <TrendingDown className='h-6 w-6 text-red-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Lợi nhuận</p>
                <p
                  className={`text-2xl font-bold ${stats.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {formatCurrency(stats.netAmount)}
                </p>
              </div>
              <div className='h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center'>
                <DollarSign className='h-6 w-6 text-blue-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  Tổng giao dịch
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  {(stats.transactionCount || 0).toLocaleString()}
                </p>
              </div>
              <div className='h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center'>
                <FileText className='h-6 w-6 text-purple-600' />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Statistics */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
        {/* Payment Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center'>
              <CreditCard className='h-5 w-5 mr-2' />
              Thống kê thanh toán
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='flex justify-between items-center p-3 bg-gray-50 rounded-lg'>
                <span className='font-medium'>Tổng đã thanh toán</span>
                <span className='font-bold text-green-600'>
                  {formatCurrency(stats.totalPaid || 0)}
                </span>
              </div>
              <div className='flex justify-between items-center p-3 bg-gray-50 rounded-lg'>
                <span className='font-medium'>Tổng chưa thanh toán</span>
                <span className='font-bold text-orange-600'>
                  {formatCurrency(stats.totalUnpaid || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center'>
              <PieChartIcon className='h-5 w-5 mr-2' />
              Thống kê tổng quan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='flex justify-between items-center p-3 bg-gray-50 rounded-lg'>
                <span className='font-medium'>
                  Số tiền trung bình/giao dịch
                </span>
                <span className='font-bold text-blue-600'>
                  {formatCurrency(stats.averageTransactionAmount || 0)}
                </span>
              </div>
              <div className='flex justify-between items-center p-3 bg-gray-50 rounded-lg'>
                <span className='font-medium'>Tỷ lệ thanh toán</span>
                <span className='font-bold text-purple-600'>
                  {(stats.paymentRatio || 0).toFixed(1)}%
                </span>
              </div>
              <div className='flex justify-between items-center p-3 bg-gray-50 rounded-lg'>
                <span className='font-medium'>Thu/Chi ratio</span>
                <span className='font-bold text-indigo-600'>
                  {(stats.totalOutcome || 0) > 0
                    ? (
                        (stats.totalIncome || 0) / (stats.totalOutcome || 0)
                      ).toFixed(2)
                    : '∞'}
                </span>
              </div>
              <div className='flex justify-between items-center p-3 bg-gray-50 rounded-lg'>
                <span className='font-medium'>Tình trạng tài chính</span>
                <span
                  className={`font-bold ${
                    (stats.netAmount || 0) >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {(stats.netAmount || 0) >= 0 ? 'Lãi' : 'Lỗ'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category and Time-based Analytics */}
      <div className='grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8'>
        {/* Income By Category Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center'>
              <BarChart3 className='h-5 w-5 mr-2' />
              Thống kê thu nhập theo danh mục
            </CardTitle>
          </CardHeader>
          <CardContent>
            {incomeByCategory.length > 0 ? (
              <ChartContainer
                config={chartConfig}
                className='mx-auto aspect-square max-h-[300px]'
              >
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) =>
                          `${name}: ${formatCurrency(Number(value))}`
                        }
                      />
                    }
                  />
                  <ChartLegend />
                  <Pie
                    data={incomeByCategory}
                    dataKey='income'
                    nameKey='category'
                    cx='50%'
                    cy='50%'
                    outerRadius={80}
                  >
                    {incomeByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <p className='text-center text-gray-500 py-8'>
                Chưa có dữ liệu danh mục
              </p>
            )}
          </CardContent>
        </Card>

        {/* Outcome By Category Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center'>
              <BarChart3 className='h-5 w-5 mr-2' />
              Thống kê chi tiêu theo danh mục
            </CardTitle>
          </CardHeader>
          <CardContent>
            {outcomeByCategory.length > 0 ? (
              <ChartContainer
                config={chartConfig}
                className='mx-auto aspect-square max-h-[300px]'
              >
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) =>
                          `${name}: ${formatCurrency(Number(value))}`
                        }
                      />
                    }
                  />
                  <ChartLegend />
                  <Pie
                    data={outcomeByCategory}
                    dataKey='outcome'
                    nameKey='category'
                    cx='50%'
                    cy='50%'
                    outerRadius={80}
                  >
                    {outcomeByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <p className='text-center text-gray-500 py-8'>
                Chưa có dữ liệu danh mục
              </p>
            )}
          </CardContent>
        </Card>

        {/* By Day Statistics */}
        <Card className='col-span-2 '>
          <CardHeader>
            <CardTitle className='flex items-center'>
              <Calendar className='h-5 w-5 mr-2' />
              Thống kê theo ngày (30 ngày gần nhất)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyChartData.length > 0 ? (
              <ChartContainer
                config={chartConfig}
                className='h-[400px] w-full md:w-3/4 mx-auto'
              >
                <LineChart
                  data={monthlyChartData}
                  {...{
                    overflow: 'visible',
                  }}
                >
                  <XAxis
                    dataKey='date'
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    type='number'
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) =>
                          `${name}: ${formatCurrency(Number(value))}`
                        }
                      />
                    }
                  />
                  <ChartLegend />
                  <Line
                    type='monotone'
                    dataKey='outcome'
                    stroke='var(--color-outcome)'
                    strokeWidth={2}
                    name='Chi tiêu'
                  />
                  <Line
                    type='monotone'
                    dataKey='income'
                    stroke='var(--color-income)'
                    strokeWidth={2}
                    name='Thu nhập'
                  />
                  <Line
                    type='monotone'
                    dataKey='net'
                    stroke='var(--color-net)'
                    strokeWidth={2}
                    name='Lãi/Lỗ'
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <p className='text-center text-gray-500 py-8'>
                Chưa có dữ liệu theo ngày
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
