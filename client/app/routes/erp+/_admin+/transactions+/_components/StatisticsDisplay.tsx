import {
  CreditCard,
  DollarSign,
  FileText,
  PieChart as PieChartIcon,
  TrendingDown,
  TrendingUp,
  BarChart3,
  Calendar,
  MapPin,
  Globe,
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
import { getProvinceBySlug } from '~/utils/address.util';

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
      label: 'Lợi nhuận',
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
    stats.byDay?.map((day) => ({
      date: day.date,
      income: day.income || 0,
      outcome: day.outcome || 0,
      net: day.net || 0,
      count: day.count || 0,
    })) || [];

  // Prepare location data for charts
  const topProvinces =
    stats.byProvince?.slice(0, 8).map((province, index) => ({
      province: getProvinceBySlug(province.province)?.name || province.province,
      total: province.total || 0,
      income: province.income || 0,
      outcome: province.outcome || 0,
      customerCount: province.customerCount || 0,
      fill: `hsl(${(index * 45) % 360}, 70%, 50%)`,
    })) || [];

  return (
    <>
      {/* Overview Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8'>
        <Card>
          <CardContent className='p-4 sm:p-6'>
            <div className='flex items-center justify-between'>
              <div className='min-w-0 flex-1'>
                <p className='text-xs sm:text-sm font-medium text-gray-600'>
                  Tổng thu
                </p>
                <p className='text-lg sm:text-xl md:text-2xl font-bold text-green-600 break-all'>
                  {formatCurrency(stats.totalIncome || 0)}
                </p>
              </div>
              <div className='h-10 w-10 sm:h-12 sm:w-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2'>
                <TrendingUp className='h-5 w-5 sm:h-6 sm:w-6 text-green-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4 sm:p-6'>
            <div className='flex items-center justify-between'>
              <div className='min-w-0 flex-1'>
                <p className='text-xs sm:text-sm font-medium text-gray-600'>
                  Tổng chi
                </p>
                <p className='text-lg sm:text-xl md:text-2xl font-bold text-red-600 break-all'>
                  {formatCurrency(stats.totalOutcome || 0)}
                </p>
              </div>
              <div className='h-10 w-10 sm:h-12 sm:w-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2'>
                <TrendingDown className='h-5 w-5 sm:h-6 sm:w-6 text-red-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4 sm:p-6'>
            <div className='flex items-center justify-between'>
              <div className='min-w-0 flex-1'>
                <p className='text-xs sm:text-sm font-medium text-gray-600'>
                  Lợi nhuận
                </p>
                <p
                  className={`text-lg sm:text-xl md:text-2xl font-bold break-all ${stats.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {formatCurrency(stats.netAmount)}
                </p>
              </div>
              <div className='h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2'>
                <DollarSign className='h-5 w-5 sm:h-6 sm:w-6 text-blue-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4 sm:p-6'>
            <div className='flex items-center justify-between'>
              <div className='min-w-0 flex-1'>
                <p className='text-xs sm:text-sm font-medium text-gray-600'>
                  Tổng giao dịch
                </p>
                <p className='text-lg sm:text-xl md:text-2xl font-bold text-gray-900'>
                  {(stats.transactionCount || 0).toLocaleString()}
                </p>
              </div>
              <div className='h-10 w-10 sm:h-12 sm:w-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2'>
                <FileText className='h-5 w-5 sm:h-6 sm:w-6 text-purple-600' />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Statistics */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8'>
        {/* Payment Statistics */}
        <Card>
          <CardHeader className='p-4 sm:p-6 pb-3 sm:pb-4'>
            <CardTitle className='flex items-center text-base sm:text-lg'>
              <CreditCard className='h-4 w-4 sm:h-5 sm:w-5 mr-2' />
              <span className='text-sm sm:text-lg'>Thống kê thanh toán</span>
            </CardTitle>
          </CardHeader>
          <CardContent className='p-4 sm:p-6 pt-0'>
            <div className='space-y-3 sm:space-y-4'>
              <div className='flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg'>
                <span className='font-medium text-xs sm:text-sm'>
                  Tổng đã thanh toán
                </span>
                <span className='font-bold text-green-600 text-xs sm:text-sm break-all'>
                  {formatCurrency(stats.totalPaid || 0)}
                </span>
              </div>
              <div className='flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg'>
                <span className='font-medium text-xs sm:text-sm'>
                  Tổng chưa thanh toán
                </span>
                <span className='font-bold text-orange-600 text-xs sm:text-sm break-all'>
                  {formatCurrency(stats.totalUnpaid || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        <Card>
          <CardHeader className='p-4 sm:p-6 pb-3 sm:pb-4'>
            <CardTitle className='flex items-center text-base sm:text-lg'>
              <PieChartIcon className='h-4 w-4 sm:h-5 sm:w-5 mr-2' />
              <span className='text-sm sm:text-lg'>Thống kê tổng quan</span>
            </CardTitle>
          </CardHeader>
          <CardContent className='p-4 sm:p-6 pt-0'>
            <div className='space-y-3 sm:space-y-4'>
              <div className='flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg'>
                <span className='font-medium text-xs sm:text-sm'>
                  Số tiền trung bình/giao dịch
                </span>
                <span className='font-bold text-blue-600 text-xs sm:text-sm break-all'>
                  {formatCurrency(stats.averageTransactionAmount || 0)}
                </span>
              </div>
              <div className='flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg'>
                <span className='font-medium text-xs sm:text-sm'>
                  Tỷ lệ thanh toán
                </span>
                <span className='font-bold text-purple-600 text-xs sm:text-sm'>
                  {(stats.paymentRatio || 0).toFixed(1)}%
                </span>
              </div>
              <div className='flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg'>
                <span className='font-medium text-xs sm:text-sm'>
                  Thu/Chi ratio
                </span>
                <span className='font-bold text-indigo-600 text-xs sm:text-sm'>
                  {(stats.totalOutcome || 0) > 0
                    ? (
                        (stats.totalIncome || 0) / (stats.totalOutcome || 0)
                      ).toFixed(2)
                    : '∞'}
                </span>
              </div>
              <div className='flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg'>
                <span className='font-medium text-xs sm:text-sm'>
                  Tình trạng tài chính
                </span>
                <span
                  className={`font-bold text-xs sm:text-sm ${
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
      <div className='grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8'>
        {/* Income By Category Statistics */}
        <Card>
          <CardHeader className='p-4 sm:p-6 pb-3 sm:pb-4'>
            <CardTitle className='flex items-center text-base sm:text-lg'>
              <BarChart3 className='h-4 w-4 sm:h-5 sm:w-5 mr-2' />
              <span className='text-sm sm:text-lg'>
                Thống kê thu nhập theo danh mục
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className='p-4 sm:p-6 pt-0'>
            {incomeByCategory.length > 0 ? (
              <ChartContainer
                config={chartConfig}
                className='mx-auto aspect-square max-h-[250px] sm:max-h-[300px]'
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
                    outerRadius={60}
                  >
                    {incomeByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <p className='text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base'>
                Chưa có dữ liệu danh mục
              </p>
            )}
          </CardContent>
        </Card>

        {/* Outcome By Category Statistics */}
        <Card>
          <CardHeader className='p-4 sm:p-6 pb-3 sm:pb-4'>
            <CardTitle className='flex items-center text-base sm:text-lg'>
              <BarChart3 className='h-4 w-4 sm:h-5 sm:w-5 mr-2' />
              <span className='text-sm sm:text-lg'>
                Thống kê chi tiêu theo danh mục
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className='p-4 sm:p-6 pt-0'>
            {outcomeByCategory.length > 0 ? (
              <ChartContainer
                config={chartConfig}
                className='mx-auto aspect-square max-h-[250px] sm:max-h-[300px]'
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
                    outerRadius={60}
                  >
                    {outcomeByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <p className='text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base'>
                Chưa có dữ liệu danh mục
              </p>
            )}
          </CardContent>
        </Card>

        {/* By Day Statistics */}
        <Card className='col-span-1 xl:col-span-2'>
          <CardHeader className='p-4 sm:p-6 pb-3 sm:pb-4'>
            <CardTitle className='flex items-center text-base sm:text-lg'>
              <Calendar className='h-4 w-4 sm:h-5 sm:w-5 mr-2' />
              <span className='text-sm sm:text-lg'>Thống kê theo ngày</span>
            </CardTitle>
          </CardHeader>
          <CardContent className='p-4 sm:p-6 pt-0'>
            {monthlyChartData.length > 0 ? (
              <ChartContainer
                config={chartConfig}
                className='h-[300px] sm:h-[400px] w-full'
              >
                <LineChart
                  data={monthlyChartData}
                  {...{
                    overflow: 'visible',
                  }}
                >
                  <XAxis
                    dataKey='date'
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
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
                    name='Lợi nhuận'
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <p className='text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base'>
                Chưa có dữ liệu theo ngày
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Location Analytics */}
      <div className='grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8'>
        {/* By Location Statistics */}
        <Card>
          <CardHeader className='p-4 sm:p-6 pb-3 sm:pb-4'>
            <CardTitle className='flex items-center text-base sm:text-lg'>
              <Globe className='h-4 w-4 sm:h-5 sm:w-5 mr-2' />
              <span className='text-sm sm:text-lg'>
                Thống kê thu nhập theo tỉnh/thành phố
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className='p-4 sm:p-6 pt-0'>
            {topProvinces.length > 0 ? (
              <ChartContainer
                config={chartConfig}
                className='mx-auto aspect-square max-h-[250px] sm:max-h-[300px]'
              >
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name, props) => [
                          formatCurrency(Number(value)),
                          `${name} (${props.payload?.customerCount || 0} khách hàng)`,
                        ]}
                      />
                    }
                  />
                  <ChartLegend />
                  <Pie
                    data={topProvinces}
                    dataKey='income'
                    nameKey='province'
                    cx='50%'
                    cy='50%'
                    outerRadius={60}
                  >
                    {topProvinces.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <p className='text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base'>
                Chưa có dữ liệu theo địa điểm
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='p-4 sm:p-6 pb-3 sm:pb-4'>
            <CardTitle className='flex items-center text-base sm:text-lg'>
              <Globe className='h-4 w-4 sm:h-5 sm:w-5 mr-2' />
              <span className='text-sm sm:text-lg'>
                Thống kê chi tiêu theo tỉnh/thành phố
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className='p-4 sm:p-6 pt-0'>
            {topProvinces.length > 0 ? (
              <ChartContainer
                config={chartConfig}
                className='mx-auto aspect-square max-h-[250px] sm:max-h-[300px]'
              >
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name, props) => [
                          formatCurrency(Number(value)),
                          `${name} (${props.payload?.customerCount || 0} khách hàng)`,
                        ]}
                      />
                    }
                  />
                  <ChartLegend />
                  <Pie
                    data={topProvinces}
                    dataKey='outcome'
                    nameKey='province'
                    cx='50%'
                    cy='50%'
                    outerRadius={60}
                  >
                    {topProvinces.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <p className='text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base'>
                Chưa có dữ liệu theo địa điểm
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='p-4 sm:p-6 pb-3 sm:pb-4'>
            <CardTitle className='flex items-center text-base sm:text-lg'>
              <Globe className='h-4 w-4 sm:h-5 sm:w-5 mr-2' />
              <span className='text-sm sm:text-lg'>
                Thống kê lợi nhuận theo tỉnh/thành phố
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className='p-4 sm:p-6 pt-0'>
            {topProvinces.length > 0 ? (
              <ChartContainer
                config={chartConfig}
                className='mx-auto aspect-square max-h-[250px] sm:max-h-[300px]'
              >
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name, props) => [
                          formatCurrency(Number(value)),
                          `${name} (${props.payload?.customerCount || 0} khách hàng)`,
                        ]}
                      />
                    }
                  />
                  <ChartLegend />
                  <Pie
                    data={topProvinces}
                    dataKey='total'
                    nameKey='province'
                    cx='50%'
                    cy='50%'
                    outerRadius={60}
                  >
                    {topProvinces.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <p className='text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base'>
                Chưa có dữ liệu theo địa điểm
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
