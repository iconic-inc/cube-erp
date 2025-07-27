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
          <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200 mx-2 sm:mx-0'>
            <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white py-4 sm:py-6 px-4 sm:px-6 rounded-t-xl'>
              <div className='flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4'>
                <div className='w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0'>
                  <DollarSign className='w-6 h-6 sm:w-8 sm:h-8 text-white' />
                </div>
                <div className='flex-1 min-w-0'>
                  <CardTitle className='text-white text-xl sm:text-2xl md:text-3xl font-bold break-words text-center sm:text-left'>
                    {transaction.tx_title}
                  </CardTitle>
                  <div className='flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 mt-2'>
                    <p className='text-base sm:text-base md:text-lg break-all'>
                      Mã: {transaction.tx_code}
                    </p>
                    <Badge
                      className={`${TRANSACTION.TYPE[transaction.tx_type].className} text-sm sm:text-sm px-2 sm:px-3 py-1 rounded-full`}
                    >
                      {TRANSACTION.TYPE[transaction.tx_type].label}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className='p-4 sm:p-6 space-y-4 sm:space-y-6'>
              {/* Financial Information */}
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
                <div className='space-y-3 sm:space-y-4'>
                  <h3 className='text-lg sm:text-lg font-semibold text-gray-900 flex items-center'>
                    <DollarSign className='w-4 h-4 sm:w-5 sm:h-5 mr-2' />
                    <span className='text-base sm:text-lg'>
                      Thông tin tài chính
                    </span>
                  </h3>

                  <div className='space-y-2 sm:space-y-3'>
                    <div className='flex items-center space-x-2 sm:space-x-3'>
                      <Receipt className='w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0' />
                      <span className='text-sm sm:text-sm text-gray-500'>
                        Số tiền:
                      </span>
                      <span className='text-sm sm:text-sm font-medium text-blue-700 break-all'>
                        {formatCurrency(transaction.tx_amount)}
                      </span>
                    </div>

                    <div className='flex items-center space-x-2 sm:space-x-3'>
                      <DollarSign className='w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0' />
                      <span className='text-sm sm:text-sm text-gray-500'>
                        Đã thanh toán:
                      </span>
                      <span className='text-sm sm:text-sm font-medium text-green-700 break-all'>
                        {formatCurrency(transaction.tx_paid)}
                      </span>
                    </div>

                    <div className='flex items-center space-x-2 sm:space-x-3'>
                      <Receipt className='w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0' />
                      <span className='text-sm sm:text-sm text-gray-500'>
                        Còn lại:
                      </span>
                      <span className='text-sm sm:text-sm font-medium text-red-700 break-all'>
                        {formatCurrency(
                          transaction.tx_amount - transaction.tx_paid,
                        )}
                      </span>
                    </div>

                    <div className='flex items-start space-x-2 sm:space-x-3'>
                      <CreditCard className='w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0 mt-0.5' />
                      <span className='text-sm sm:text-sm text-gray-500'>
                        Phương thức:
                      </span>
                      <span className='text-sm sm:text-sm font-medium break-words'>
                        {getPaymentMethodLabel(transaction.tx_paymentMethod)}
                      </span>
                    </div>

                    <div className='flex items-start space-x-2 sm:space-x-3'>
                      <Tag className='w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0 mt-0.5' />
                      <span className='text-sm sm:text-sm text-gray-500'>
                        Danh mục:
                      </span>
                      <span className='text-sm sm:text-sm font-medium break-words'>
                        {getCategoryLabel(
                          transaction.tx_type,
                          transaction.tx_category,
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Related Information */}
                <div className='space-y-3 sm:space-y-4'>
                  <h3 className='text-lg sm:text-lg font-semibold text-gray-900 flex items-center'>
                    <User className='w-4 h-4 sm:w-5 sm:h-5 mr-2' />
                    <span className='text-base sm:text-lg'>
                      Thông tin liên quan
                    </span>
                  </h3>

                  <div className='space-y-2 sm:space-y-3'>
                    <div className='flex items-start space-x-2 sm:space-x-3'>
                      <User className='w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0 mt-0.5' />
                      <span className='text-sm sm:text-sm text-gray-500'>
                        Người tạo:
                      </span>
                      <Link
                        to={`/erp/employees/${transaction.tx_createdBy?.id}`}
                        className='text-sm sm:text-sm font-medium text-blue-600 hover:underline break-words'
                      >
                        {transaction.tx_createdBy?.emp_user.usr_firstName}{' '}
                        {transaction.tx_createdBy?.emp_user.usr_lastName} (
                        {transaction.tx_createdBy?.emp_code})
                      </Link>
                    </div>

                    {transaction.tx_customer && (
                      <div className='flex items-start space-x-2 sm:space-x-3'>
                        <User className='w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0 mt-0.5' />
                        <span className='text-sm sm:text-sm text-gray-500'>
                          Khách hàng:
                        </span>
                        <Link
                          to={`/erp/customers/${transaction.tx_customer.id}`}
                          className='text-sm sm:text-sm font-medium text-blue-600 hover:underline break-words'
                        >
                          {transaction.tx_customer.cus_firstName}{' '}
                          {transaction.tx_customer.cus_lastName} (
                          {transaction.tx_customer.cus_code})
                        </Link>
                      </div>
                    )}

                    {transaction.tx_caseService && (
                      <div className='flex items-start space-x-2 sm:space-x-3'>
                        <Building className='w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0 mt-0.5' />
                        <span className='text-sm sm:text-sm text-gray-500'>
                          Hồ sơ vụ việc:
                        </span>
                        <Link
                          to={`/erp/cases/${transaction.tx_caseService.id}`}
                          className='text-sm sm:text-sm font-medium text-blue-600 hover:underline break-words'
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

                    <div className='flex items-start space-x-2 sm:space-x-3'>
                      <Calendar className='w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0 mt-0.5' />
                      <span className='text-sm sm:text-sm text-gray-500'>
                        Ngày giao dịch:
                      </span>
                      <span className='text-sm sm:text-sm font-medium break-words'>
                        {transaction.tx_date
                          ? format(
                              new Date(transaction.tx_date),
                              'dd/MM/yyyy',
                              { locale: vi },
                            )
                          : 'Không có thông tin'}
                      </span>
                    </div>

                    <div className='flex items-start space-x-2 sm:space-x-3'>
                      <Calendar className='w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0 mt-0.5' />
                      <span className='text-sm sm:text-sm text-gray-500'>
                        Cập nhật lúc:
                      </span>
                      <span className='text-sm sm:text-sm font-medium break-words'>
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
                <div className='space-y-2 sm:space-y-3'>
                  <h3 className='text-lg sm:text-lg font-semibold text-gray-900 flex items-center'>
                    <FileText className='w-4 h-4 sm:w-5 sm:h-5 mr-2' />
                    <span className='text-base sm:text-lg'>
                      Mô tả giao dịch
                    </span>
                  </h3>
                  <div className='bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200'>
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
