import { useEffect } from 'react';
import Defer from '~/components/Defer';
import TextRenderer from '~/components/TextRenderer';
import { Badge } from '~/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { TRANSACTION } from '~/constants/transaction.constant';
import { ILoaderDataPromise } from '~/interfaces/app.interface';
import { ITransaction } from '~/interfaces/transaction.interface';
import { formatCurrency, formatDate } from '~/utils';

interface TransactionDetailProps {
  transactionPromise: ILoaderDataPromise<ITransaction>;
}

// Helper to get label from TRANSACTION.PAYMENT_METHOD
function getPaymentMethodLabel(method: string) {
  const entry = Object.values(TRANSACTION.PAYMENT_METHOD).find(
    (m) => m.value === method,
  );
  return entry ? entry.label : method;
}

// Helper to get label from TRANSACTION.CATEGORY
function getCategoryLabel(type: string, category: string) {
  const catGroup =
    TRANSACTION.CATEGORY[type as keyof typeof TRANSACTION.CATEGORY];
  if (!catGroup) return category;
  const entry = Object.values(catGroup).find((c) => c.value === category);
  return entry ? entry.label : category;
}

export default function TransactionDetail({
  transactionPromise,
}: TransactionDetailProps): JSX.Element {
  return (
    <Defer resolve={transactionPromise}>
      {(transaction) => (
        <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200'>
          <CardHeader className='bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-6 rounded-t-xl'>
            <CardTitle className='text-white text-3xl font-bold'>
              {transaction.tx_title}
            </CardTitle>
            <CardDescription className='text-blue-100 mt-2 flex items-center gap-4'>
              <span>Mã giao dịch: {transaction.tx_code}</span>
              <Badge
                className={`${TRANSACTION.TYPE[transaction.tx_type].className}`}
              >
                {TRANSACTION.TYPE[transaction.tx_type].label}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className='p-6 space-y-6'>
            {/* Transaction Description */}
            <div>
              <Label
                htmlFor='tx_description'
                className='text-gray-700 font-semibold mb-2 block'
              >
                Mô tả
              </Label>
              <div
                id='tx_description'
                className='rounded-lg border border-gray-300 px-3 bg-gray-50 text-gray-800 break-words min-h-[80px]'
              >
                <TextRenderer
                  content={transaction.tx_description || 'Không có mô tả'}
                />
              </div>
            </div>

            {/* Amount, Paid, Payment Method, Category */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-gray-200 pt-6'>
              <div>
                <Label className='text-gray-700 font-semibold mb-2 block'>
                  Số tiền
                </Label>
                <Input
                  value={formatCurrency(transaction.tx_amount)}
                  readOnly
                  className='bg-white border-gray-300 font-bold text-blue-700'
                />
              </div>
              <div>
                <Label className='text-gray-700 font-semibold mb-2 block'>
                  Đã thanh toán
                </Label>
                <Input
                  value={formatCurrency(transaction.tx_paid)}
                  readOnly
                  className='bg-white border-gray-300 font-bold text-green-700'
                />
              </div>
              <div>
                <Label className='text-gray-700 font-semibold mb-2 block'>
                  Còn lại
                </Label>
                <Input
                  value={formatCurrency(
                    transaction.tx_amount - transaction.tx_paid,
                  )}
                  readOnly
                  className='bg-white border-gray-300 font-bold text-red-700'
                />
              </div>
              <div>
                <Label className='text-gray-700 font-semibold mb-2 block'>
                  Phương thức thanh toán
                </Label>
                <Input
                  value={getPaymentMethodLabel(transaction.tx_paymentMethod)}
                  readOnly
                  className='bg-white border-gray-300'
                />
              </div>
              <div>
                <Label className='text-gray-700 font-semibold mb-2 block'>
                  Danh mục
                </Label>
                <Input
                  value={getCategoryLabel(
                    transaction.tx_type,
                    transaction.tx_category,
                  )}
                  readOnly
                  className='bg-white border-gray-300'
                />
              </div>
            </div>

            {/* Customer and Case Service */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-200 pt-6'>
              <div>
                <Label className='text-gray-700 font-semibold mb-2 block'>
                  Khách hàng
                </Label>
                <Input
                  value={
                    transaction.tx_customer
                      ? `${transaction.tx_customer.cus_firstName} ${transaction.tx_customer.cus_lastName} (${transaction.tx_customer.cus_code})`
                      : ''
                  }
                  readOnly
                  className='bg-white border-gray-300'
                />
              </div>
              <div>
                <Label className='text-gray-700 font-semibold mb-2 block'>
                  Hồ sơ vụ việc
                </Label>
                <Input
                  value={
                    transaction.tx_caseService
                      ? `${transaction.tx_caseService.case_code} - ${transaction.tx_caseService.case_customer.cus_firstName} ${transaction.tx_caseService.case_customer.cus_lastName}`
                      : ''
                  }
                  readOnly
                  className='bg-white border-gray-300'
                />
              </div>
            </div>

            {/* Timestamps */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-200 pt-6'>
              <div>
                <Label className='text-gray-700 font-semibold mb-2 block'>
                  Tạo lúc
                </Label>
                <Input
                  value={formatDate(
                    transaction.createdAt,
                    'HH:mm - DD/MM/YYYY',
                  )}
                  readOnly
                  className='bg-gray-50 border-gray-300'
                />
              </div>
              <div>
                <Label className='text-gray-700 font-semibold mb-2 block'>
                  Cập nhật lúc
                </Label>
                <Input
                  value={formatDate(
                    transaction.updatedAt,
                    'HH:mm - DD/MM/YYYY',
                  )}
                  readOnly
                  className='bg-gray-50 border-gray-300'
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </Defer>
  );
}
