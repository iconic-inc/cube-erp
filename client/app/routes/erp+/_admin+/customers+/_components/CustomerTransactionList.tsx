import { Link } from '@remix-run/react';
import Defer from '~/components/Defer';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { ILoaderDataPromise } from '~/interfaces/app.interface';
import { IListResponse } from '~/interfaces/response.interface';
import { ITransaction } from '~/interfaces/transaction.interface';
import { formatDate } from '~/utils';
import { Plus } from 'lucide-react';
import { NumericFormat } from 'react-number-format';
import { TRANSACTION } from '~/constants/transaction.constant';

interface CustomerTransactionListProps {
  customerId: string;
  customerTransactionsPromise: ILoaderDataPromise<IListResponse<ITransaction>>;
}

export default function CustomerTransactionList({
  customerId,
  customerTransactionsPromise,
}: CustomerTransactionListProps): JSX.Element {
  return (
    <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200'>
      <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white py-4 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0'>
        <div className='text-center sm:text-left w-full'>
          <CardTitle className='text-white text-lg sm:text-xl lg:text-2xl font-bold'>
            Giao dịch
          </CardTitle>
          <CardDescription className='text-yellow-400 text-sm sm:text-base mt-1'>
            Danh sách giao dịch của khách hàng
          </CardDescription>
        </div>
        <Button
          variant='secondary'
          size='sm'
          className='bg-white text-red-700 hover:bg-red-50 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 mx-auto sm:m-0 w-fit'
          asChild
        >
          <Link to={`/erp/transactions/new?customerId=${customerId}`}>
            <Plus className='w-3 h-3 sm:w-4 sm:h-4' />
            <span className='hidden sm:inline'>Tạo giao dịch mới</span>
            <span className='sm:hidden'>Tạo mới</span>
          </Link>
        </Button>
      </CardHeader>
      <CardContent className='p-4 sm:p-6'>
        <Defer resolve={customerTransactionsPromise}>
          {(transactionsData) => {
            const transactions = transactionsData.data || [];

            if (transactions.length === 0) {
              return (
                <div className='text-center py-6 sm:py-8 text-gray-500'>
                  <p className='text-base sm:text-lg'>Chưa có giao dịch nào</p>
                  <p className='text-sm sm:text-base mt-2'>
                    Tạo giao dịch mới để bắt đầu quản lý tài chính
                  </p>
                </div>
              );
            }

            return (
              <div className='space-y-3 sm:space-y-4'>
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className='border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow'
                  >
                    <div className='flex flex-row sm:items-center justify-between mb-3 space-y-2 sm:space-y-0'>
                      <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3'>
                        <h3 className='font-semibold text-base sm:text-lg text-gray-800'>
                          {transaction.tx_code}
                        </h3>
                        <div className='flex flex-wrap gap-1 sm:gap-2'>
                          <Badge
                            variant={
                              transaction.tx_type === 'income'
                                ? 'default'
                                : 'destructive'
                            }
                            className={`text-xs sm:text-sm ${
                              transaction.tx_type === 'income'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {transaction.tx_type === 'income' ? 'Thu' : 'Chi'}
                          </Badge>
                          {transaction.tx_amount > transaction.tx_paid && (
                            <Badge
                              variant='outline'
                              className='bg-yellow-50 text-yellow-700 border-yellow-300 text-xs sm:text-sm'
                            >
                              Còn nợ
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant='outline'
                        size='sm'
                        className='text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 w-fit'
                      >
                        <Link to={`/erp/transactions/${transaction.id}`}>
                          <span className=''>Xem chi tiết</span>
                        </Link>
                      </Button>
                    </div>

                    <div className='mb-3'>
                      <h4 className='font-medium text-sm sm:text-base text-gray-800 line-clamp-2'>
                        {transaction.tx_title}
                      </h4>
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-sm text-gray-600'>
                      <div className='sm:col-span-1'>
                        <span className='font-medium'>Số tiền:</span>{' '}
                        <NumericFormat
                          value={transaction.tx_amount}
                          displayType='text'
                          thousandSeparator=','
                          suffix=' VNĐ'
                          className='font-bold text-blue-700 text-xs sm:text-sm'
                        />
                      </div>
                      <div className='sm:col-span-1'>
                        <span className='font-medium'>Đã thanh toán:</span>{' '}
                        <NumericFormat
                          value={transaction.tx_paid}
                          displayType='text'
                          thousandSeparator=','
                          suffix=' VNĐ'
                          className='font-bold text-green-700 text-xs sm:text-sm'
                        />
                      </div>
                      <div>
                        <span className='font-medium'>Ngày tạo:</span>{' '}
                        {formatDate(transaction.createdAt, 'DD/MM/YYYY')}
                      </div>
                      <div>
                        <span className='font-medium'>Phương thức:</span>{' '}
                        <span className='break-words'>
                          {Object.values(TRANSACTION.PAYMENT_METHOD).find(
                            (method) =>
                              method.value === transaction.tx_paymentMethod,
                          )?.label || 'Khác'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          }}
        </Defer>
      </CardContent>
    </Card>
  );
}
