import { ITransaction } from '~/interfaces/transaction.interface';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { NumericFormat } from 'react-number-format';
import { formatDate } from 'date-fns/format';
import { TRANSACTION } from '~/constants/transaction.constant';
import { Link } from '@remix-run/react';

export default function BriefTransactionCard({
  transaction,
}: {
  transaction: ITransaction;
}) {
  return (
    <div
      key={transaction.id}
      className='border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow'
    >
      <div className='flex flex-row sm:items-center justify-between mb-3 space-y-2 sm:space-y-0'>
        <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3'>
          <div className='flex flex-wrap gap-1 sm:gap-2'>
            <h4 className='font-medium text-sm sm:text-base text-gray-800 line-clamp-2'>
              {transaction.tx_title}
            </h4>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-sm text-gray-600'>
        <div className='sm:col-span-1'>
          <span className='font-medium'>Số tiền:</span>{' '}
          <NumericFormat
            value={transaction.tx_amount}
            displayType='text'
            thousandSeparator=','
            suffix=' VNĐ'
            className='font-bold text-blue-700 text-sm sm:text-base'
          />
        </div>

        <div>
          <span className='font-medium'></span>{' '}
          <Badge
            variant={
              transaction.tx_type === 'income' ? 'default' : 'destructive'
            }
            className={`text-sm sm:text-base ${
              transaction.tx_type === 'income'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {transaction.tx_type === 'income' ? 'Thu' : 'Chi'}
          </Badge>
        </div>
        <div>
          <span className='font-medium'>Phương thức:</span>{' '}
          <span className='break-words'>
            {Object.values(TRANSACTION.PAYMENT_METHOD).find(
              (method) => method.value === transaction.tx_paymentMethod,
            )?.label || 'Khác'}
          </span>
        </div>
      </div>
    </div>
  );
}
