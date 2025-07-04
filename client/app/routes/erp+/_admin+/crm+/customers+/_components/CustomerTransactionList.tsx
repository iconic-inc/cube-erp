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
      <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white py-4 flex flex-row items-center justify-between'>
        <div>
          <CardTitle className='text-white text-xl font-bold'>
            Giao dịch
          </CardTitle>
          <CardDescription className='text-purple-100 mt-1'>
            Danh sách giao dịch của khách hàng
          </CardDescription>
        </div>
        <Link to={`/erp/transactions/new?customerId=${customerId}`}>
          <Button
            variant='secondary'
            size='sm'
            className='bg-white text-purple-700 hover:bg-purple-50'
          >
            <Plus className='w-4 h-4 mr-1' />
            Tạo giao dịch mới
          </Button>
        </Link>
      </CardHeader>
      <CardContent className='p-6'>
        <Defer resolve={customerTransactionsPromise}>
          {(transactionsData) => {
            const transactions = transactionsData.data || [];

            if (transactions.length === 0) {
              return (
                <div className='text-center py-8 text-gray-500'>
                  <p className='text-lg'>Chưa có giao dịch nào</p>
                  <p className='text-sm mt-2'>
                    Tạo giao dịch mới để bắt đầu quản lý tài chính
                  </p>
                </div>
              );
            }

            return (
              <div className='space-y-4'>
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className='border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow'
                  >
                    <div className='flex items-center justify-between mb-3'>
                      <div className='flex items-center gap-3'>
                        <h3 className='font-semibold text-lg text-gray-800'>
                          {transaction.tx_code}
                        </h3>
                        <Badge
                          variant={
                            transaction.tx_type === 'income'
                              ? 'default'
                              : 'destructive'
                          }
                          className={
                            transaction.tx_type === 'income'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }
                        >
                          {transaction.tx_type === 'income' ? 'Thu' : 'Chi'}
                        </Badge>
                        {transaction.tx_amount > transaction.tx_paid && (
                          <Badge
                            variant='outline'
                            className='bg-yellow-50 text-yellow-700 border-yellow-300'
                          >
                            Còn nợ
                          </Badge>
                        )}
                      </div>
                      <Link to={`/erp/transactions/${transaction.id}`}>
                        <Button variant='outline' size='sm'>
                          Xem chi tiết
                        </Button>
                      </Link>
                    </div>

                    <div className='mb-3'>
                      <h4 className='font-medium text-gray-800'>
                        {transaction.tx_title}
                      </h4>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600'>
                      <div>
                        <span className='font-medium'>Số tiền:</span>{' '}
                        <NumericFormat
                          value={transaction.tx_amount}
                          displayType='text'
                          thousandSeparator=','
                          suffix=' VNĐ'
                          className='font-bold text-blue-700'
                        />
                      </div>
                      <div>
                        <span className='font-medium'>Đã thanh toán:</span>{' '}
                        <NumericFormat
                          value={transaction.tx_paid}
                          displayType='text'
                          thousandSeparator=','
                          suffix=' VNĐ'
                          className='font-bold text-green-700'
                        />
                      </div>
                      <div>
                        <span className='font-medium'>Ngày tạo:</span>{' '}
                        {formatDate(transaction.createdAt, 'DD/MM/YYYY')}
                      </div>
                      <div>
                        <span className='font-medium'>Phương thức:</span>{' '}
                        {transaction.tx_paymentMethod}
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
