import { Link } from '@remix-run/react';
import Defer from '~/components/Defer';
import LoadingCard from '~/components/LoadingCard';
import ErrorCard from '~/components/ErrorCard';
import TextRenderer from '~/components/TextRenderer';
import { Badge } from '~/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { TRANSACTION } from '~/constants/transaction.constant';
import { ILoaderDataPromise } from '~/interfaces/app.interface';
import { ITransaction } from '~/interfaces/transaction.interface';
import { formatCurrency, formatDate } from '~/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  DollarSign,
  Calendar,
  User,
  FileText,
  CreditCard,
  Tag,
  Building,
  Receipt,
} from 'lucide-react';

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
    <Defer resolve={transactionPromise} fallback={<LoadingCard />}>
      {(transaction) => {
        if (!transaction || 'success' in transaction) {
          return (
            <ErrorCard
              message={
                transaction &&
                'message' in transaction &&
                typeof transaction.message === 'string'
                  ? transaction.message
                  : 'Đã xảy ra lỗi khi tải dữ liệu giao dịch'
              }
            />
          );
        }

        return (
          <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200'>
            <CardHeader className='bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-6 rounded-t-xl'>
              <div className='flex items-center space-x-4'>
                <div className='w-16 h-16 bg-white/20 rounded-full flex items-center justify-center'>
                  <DollarSign className='w-8 h-8 text-white' />
                </div>
                <div>
                  <CardTitle className='text-white text-3xl font-bold'>
                    {transaction.tx_title}
                  </CardTitle>
                  <div className='flex items-center space-x-3 mt-2'>
                    <p className='text-blue-100 text-lg'>
                      Mã: {transaction.tx_code}
                    </p>
                    <Badge
                      className={`${TRANSACTION.TYPE[transaction.tx_type].className} text-sm px-3 py-1 rounded-full`}
                    >
                      {TRANSACTION.TYPE[transaction.tx_type].label}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className='p-6 space-y-6'>
              {/* Financial Information */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-4'>
                  <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
                    <DollarSign className='w-5 h-5 mr-2' />
                    Thông tin tài chính
                  </h3>

                  <div className='space-y-3'>
                    <div className='flex items-center space-x-3'>
                      <Receipt className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>Số tiền:</span>
                      <span className='text-sm font-medium text-blue-700'>
                        {formatCurrency(transaction.tx_amount)}
                      </span>
                    </div>

                    <div className='flex items-center space-x-3'>
                      <DollarSign className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>
                        Đã thanh toán:
                      </span>
                      <span className='text-sm font-medium text-green-700'>
                        {formatCurrency(transaction.tx_paid)}
                      </span>
                    </div>

                    <div className='flex items-center space-x-3'>
                      <Receipt className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>Còn lại:</span>
                      <span className='text-sm font-medium text-red-700'>
                        {formatCurrency(
                          transaction.tx_amount - transaction.tx_paid,
                        )}
                      </span>
                    </div>

                    <div className='flex items-center space-x-3'>
                      <CreditCard className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>
                        Phương thức:
                      </span>
                      <span className='text-sm font-medium'>
                        {getPaymentMethodLabel(transaction.tx_paymentMethod)}
                      </span>
                    </div>

                    <div className='flex items-center space-x-3'>
                      <Tag className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>Danh mục:</span>
                      <span className='text-sm font-medium'>
                        {getCategoryLabel(
                          transaction.tx_type,
                          transaction.tx_category,
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Related Information */}
                <div className='space-y-4'>
                  <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
                    <User className='w-5 h-5 mr-2' />
                    Thông tin liên quan
                  </h3>

                  <div className='space-y-3'>
                    <div className='flex items-center space-x-3'>
                      <User className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>Người tạo:</span>
                      <Link
                        to={`/erp/employees/${transaction.tx_createdBy?.id}`}
                        className='text-sm font-medium text-blue-600 hover:underline'
                      >
                        {transaction.tx_createdBy?.emp_user.usr_firstName}{' '}
                        {transaction.tx_createdBy?.emp_user.usr_lastName} (
                        {transaction.tx_createdBy?.emp_code})
                      </Link>
                    </div>

                    {transaction.tx_customer && (
                      <div className='flex items-center space-x-3'>
                        <User className='w-4 h-4 text-gray-400' />
                        <span className='text-sm text-gray-500'>
                          Khách hàng:
                        </span>
                        <Link
                          to={`/erp/crm/customers/${transaction.tx_customer.id}`}
                          className='text-sm font-medium text-blue-600 hover:underline'
                        >
                          {transaction.tx_customer.cus_firstName}{' '}
                          {transaction.tx_customer.cus_lastName} (
                          {transaction.tx_customer.cus_code})
                        </Link>
                      </div>
                    )}

                    {transaction.tx_caseService && (
                      <div className='flex items-center space-x-3'>
                        <Building className='w-4 h-4 text-gray-400' />
                        <span className='text-sm text-gray-500'>
                          Hồ sơ vụ việc:
                        </span>
                        <Link
                          to={`/erp/crm/cases/${transaction.tx_caseService.id}`}
                          className='text-sm font-medium text-blue-600 hover:underline'
                        >
                          {transaction.tx_caseService.case_code} -{' '}
                          {
                            transaction.tx_caseService.case_customer
                              .cus_firstName
                          }{' '}
                          {
                            transaction.tx_caseService.case_customer
                              .cus_lastName
                          }
                        </Link>
                      </div>
                    )}

                    <div className='flex items-center space-x-3'>
                      <Calendar className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>
                        Ngày giao dịch:
                      </span>
                      <span className='text-sm font-medium'>
                        {transaction.tx_date
                          ? format(
                              new Date(transaction.tx_date),
                              'dd/MM/yyyy',
                              { locale: vi },
                            )
                          : 'Không có thông tin'}
                      </span>
                    </div>

                    <div className='flex items-center space-x-3'>
                      <Calendar className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>
                        Cập nhật lúc:
                      </span>
                      <span className='text-sm font-medium'>
                        {transaction.updatedAt
                          ? format(
                              new Date(transaction.updatedAt),
                              'dd/MM/yyyy HH:mm',
                              { locale: vi },
                            )
                          : 'Không có thông tin'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {transaction.tx_description && (
                <div className='space-y-3'>
                  <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
                    <FileText className='w-5 h-5 mr-2' />
                    Mô tả giao dịch
                  </h3>
                  <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
                    <TextRenderer content={transaction.tx_description} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      }}
    </Defer>
  );
}
