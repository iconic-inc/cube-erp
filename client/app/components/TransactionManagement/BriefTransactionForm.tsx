import {
  ITransaction,
  ITransactionCreate,
} from '~/interfaces/transaction.interface';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { NumericFormat } from 'react-number-format';
import { formatDate } from 'date-fns/format';
import { TRANSACTION } from '~/constants/transaction.constant';
import { Link } from '@remix-run/react';
import { useState } from 'react';
import { generateCode } from '~/utils';

export default function BriefTransactionForm({
  transaction,
  onConfirm,
  onCancel,
}: {
  transaction?: ITransaction;
  onConfirm: (transaction: ITransactionCreate) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<ITransactionCreate>({
    code: transaction?.tx_code || generateCode('TX'),
    title: transaction?.tx_title || '',
    type: TRANSACTION.TYPE.income.value,
    amount: transaction?.tx_amount || 0,
    paid: transaction?.tx_paid || 0,
    paymentMethod:
      transaction?.tx_paymentMethod || TRANSACTION.PAYMENT_METHOD.CASH.value,
    category:
      transaction?.tx_category || TRANSACTION.CATEGORY.income.OTHER.value,
  });

  const isEditing = !!transaction;

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Card className='hover:shadow-md transition-shadow'>
      <CardHeader className='pb-3'>
        <div className='flex flex-row sm:items-center justify-between space-y-2 sm:space-y-0'>
          <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3'>
            <CardTitle className='text-base sm:text-lg text-gray-800'>
              {isEditing ? transaction.tx_code : 'Tạo giao dịch mới'}
            </CardTitle>
            {isEditing && (
              <div className='flex flex-wrap gap-1 sm:gap-2'>
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
                {transaction.tx_amount > transaction.tx_paid && (
                  <Badge
                    variant='outline'
                    className='bg-yellow-50 text-yellow-700 border-yellow-300 text-sm sm:text-base'
                  >
                    Còn nợ
                  </Badge>
                )}
              </div>
            )}
          </div>
          {isEditing && (
            <Button
              variant='outline'
              size='sm'
              className='text-sm sm:text-base px-2 sm:px-3 py-1 sm:py-2 w-fit'
            >
              <Link
                prefetch='intent'
                to={`/erp/transactions/${transaction.id}`}
              >
                <span className=''>Xem chi tiết</span>
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className='pt-0 space-y-4'>
        {isEditing ? (
          // Display mode for existing transaction
          <>
            <div>
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
                  className='font-bold text-blue-700 text-sm sm:text-base'
                  onValueChange={(values) => {
                    const { floatValue } = values;
                    handleInputChange('amount', floatValue || 0);
                    handleInputChange('paid', floatValue || 0);
                  }}
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
                    (method) => method.value === transaction.tx_paymentMethod,
                  )?.label || 'Khác'}
                </span>
              </div>
            </div>
          </>
        ) : (
          // Form mode for creating new transaction
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div className='space-y-2 sm:col-span-2'>
              <Label htmlFor='title'>Tiêu đề giao dịch</Label>
              <Input
                id='title'
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder='Nhập tiêu đề giao dịch'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='amount'>Số tiền</Label>
              <Input
                id='amount'
                type='number'
                value={formData.amount}
                onChange={(e) =>
                  handleInputChange('amount', parseFloat(e.target.value) || 0)
                }
                placeholder='Nhập số tiền'
              />
            </div>

            <div className='space-y-2 col-span-2 sm:col-span-1'>
              <Label htmlFor='paymentMethod'>Phương thức thanh toán</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) =>
                  handleInputChange('paymentMethod', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Chọn phương thức thanh toán' />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(TRANSACTION.PAYMENT_METHOD).map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className='flex justify-end gap-2'>
        <Button type='button' variant='outline' onClick={onCancel}>
          Hủy
        </Button>
        <Button type='button' onClick={() => onConfirm(formData)}>
          {isEditing ? 'Xác nhận' : 'Tạo giao dịch'}
        </Button>
      </CardFooter>
    </Card>
  );
}
