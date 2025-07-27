import { Link } from '@remix-run/react';
import Defer from '~/components/Defer';
import LoadingCard from '~/components/LoadingCard';
import ErrorCard from '~/components/ErrorCard';
import TextRenderer from '~/components/TextRenderer';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { ILoaderDataPromise } from '~/interfaces/app.interface';
import { ICustomer } from '~/interfaces/customer.interface';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  IdCard,
  Users,
  FileText,
  Edit,
  ArrowLeft,
  Plus,
} from 'lucide-react';
import { Button } from '~/components/ui/button';
import { toAddressString } from '~/utils/address.util';
import { CUSTOMER } from '~/constants/customer.constant';

export default function CustomerDetail({
  customerPromise,
}: {
  customerPromise: ILoaderDataPromise<ICustomer>;
}) {
  const getSourceLabel = (source?: string) => {
    return (
      Object.values(CUSTOMER.SOURCE).find((src) => src.value === source)
        ?.label || CUSTOMER.SOURCE.OTHER.label
    );
  };

  const getContactChannelLabel = (channel?: string) => {
    return (
      Object.values(CUSTOMER.CONTACT_CHANNEL).find((ch) => ch.value === channel)
        ?.label || CUSTOMER.CONTACT_CHANNEL.OTHER.label
    );
  };

  return (
    <Defer resolve={customerPromise} fallback={<LoadingCard />}>
      {(customer) => {
        if (!customer || 'success' in customer) {
          return (
            <ErrorCard
              message={
                customer &&
                'message' in customer &&
                typeof customer.message === 'string'
                  ? customer.message
                  : 'Đã xảy ra lỗi khi tải dữ liệu khách hàng'
              }
            />
          );
        }

        return (
          <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200'>
            <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white py-4 sm:py-6 rounded-t-xl'>
              <div className='flex flex-col sm:flex-row items-center sm:items-start space-y-3 sm:space-y-0 sm:space-x-4'>
                <div className='w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0'>
                  <Users className='w-6 h-6 sm:w-8 sm:h-8 text-white' />
                </div>
                <div className='text-center sm:text-left'>
                  <CardTitle className='text-white text-xl sm:text-2xl lg:text-3xl font-bold'>
                    {customer.cus_firstName} {customer.cus_lastName}
                  </CardTitle>
                  <p className='text-yellow-400 text-base lg:text-lg'>
                    {customer.cus_code || 'Chưa có mã khách hàng'}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className='p-4 sm:p-6 space-y-4 sm:space-y-6'>
              {/* Basic Information */}
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
                <div className='space-y-3 sm:space-y-4'>
                  <h3 className='text-lg md:text-xl font-semibold text-gray-900 flex items-center'>
                    <User className='w-5 h-5 md:w-6 md:h-6 mr-2' />
                    Thông tin cơ bản
                  </h3>

                  <div className='space-y-2 sm:space-y-3'>
                    <div className='flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3'>
                      <div className='flex items-center space-x-2 sm:space-x-3'>
                        <IdCard className='w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0' />
                        <span className='text-sm md:text-base text-gray-500'>
                          Mã khách hàng:
                        </span>
                      </div>
                      <span className='text-sm md:text-base font-medium pl-5 sm:pl-0'>
                        {customer.cus_code || 'Chưa có mã'}
                      </span>
                    </div>

                    <div className='flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3'>
                      <div className='flex items-center space-x-2 sm:space-x-3'>
                        <Phone className='w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0' />
                        <span className='text-sm md:text-base text-gray-500'>
                          Số điện thoại:
                        </span>
                      </div>
                      <span className='text-sm md:text-base font-medium pl-5 sm:pl-0'>
                        {customer.cus_msisdn || 'Chưa có số điện thoại'}
                      </span>
                    </div>

                    <div className='flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3'>
                      <div className='flex items-center space-x-2 sm:space-x-3'>
                        <Mail className='w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0' />
                        <span className='text-sm md:text-base text-gray-500'>
                          Email:
                        </span>
                      </div>
                      <span className='text-sm md:text-base font-medium pl-5 sm:pl-0'>
                        {customer.cus_email || 'Chưa có email'}
                      </span>
                    </div>

                    <div className='flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3'>
                      <div className='flex items-center space-x-2 sm:space-x-3'>
                        <Calendar className='w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0' />
                        <span className='text-sm md:text-base text-gray-500'>
                          Ngày sinh:
                        </span>
                      </div>
                      <span className='text-sm md:text-base font-medium pl-5 sm:pl-0'>
                        {customer.cus_birthDate
                          ? format(
                              new Date(customer.cus_birthDate),
                              'dd/MM/yyyy',
                              { locale: vi },
                            )
                          : 'Chưa có thông tin'}
                      </span>
                    </div>

                    <div className='flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3'>
                      <div className='flex items-center space-x-2 sm:space-x-3'>
                        <User className='w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0' />
                        <span className='text-sm md:text-base text-gray-500'>
                          Giới tính:
                        </span>
                      </div>
                      <div className='pl-5 sm:pl-0'>
                        <Badge
                          variant='secondary'
                          className='text-xs sm:text-sm'
                        >
                          {customer.cus_sex === 'male'
                            ? 'Nam'
                            : customer.cus_sex === 'female'
                              ? 'Nữ'
                              : 'Chưa có thông tin'}
                        </Badge>
                      </div>
                    </div>

                    <div className='flex flex-col sm:flex-row sm:items-start space-y-1 sm:space-y-0 sm:space-x-3'>
                      <div className='flex items-center space-x-2 sm:space-x-3'>
                        <MapPin className='w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0' />
                        <span className='text-sm md:text-base text-gray-500'>
                          Địa chỉ:
                        </span>
                      </div>
                      <span className='text-sm md:text-base font-medium pl-5 sm:pl-0 break-words'>
                        {toAddressString(customer.cus_address)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className='space-y-3 sm:space-y-4'>
                  <h3 className='text-lg md:text-xl font-semibold text-gray-900 flex items-center'>
                    <Users className='w-5 h-5 md:w-6 md:h-6 mr-2' />
                    Thông tin khách hàng
                  </h3>

                  <div className='space-y-2 sm:space-y-3'>
                    <div className='flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3'>
                      <div className='flex items-center space-x-2 sm:space-x-3'>
                        <Phone className='w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0' />
                        <span className='text-sm md:text-base text-gray-500'>
                          Kênh liên hệ:
                        </span>
                      </div>
                      <div className='pl-5 sm:pl-0'>
                        <Badge variant='outline' className='text-xs sm:text-sm'>
                          {getContactChannelLabel(customer.cus_contactChannel)}
                        </Badge>
                      </div>
                    </div>

                    <div className='flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3'>
                      <div className='flex items-center space-x-2 sm:space-x-3'>
                        <Users className='w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0' />
                        <span className='text-sm md:text-base text-gray-500'>
                          Nguồn:
                        </span>
                      </div>
                      <div className='pl-5 sm:pl-0'>
                        <Badge variant='default' className='text-xs sm:text-sm'>
                          {getSourceLabel(customer.cus_source)}
                        </Badge>
                      </div>
                    </div>

                    <div className='flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3'>
                      <div className='flex items-center space-x-2 sm:space-x-3'>
                        <Calendar className='w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0' />
                        <span className='text-sm md:text-base text-gray-500'>
                          Ngày tạo:
                        </span>
                      </div>
                      <span className='text-sm md:text-base font-medium pl-5 sm:pl-0'>
                        {customer.cus_createdAt
                          ? format(
                              new Date(customer.cus_createdAt),
                              'dd/MM/yyyy',
                              { locale: vi },
                            )
                          : 'Không có thông tin'}
                      </span>
                    </div>

                    <div className='flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3'>
                      <div className='flex items-center space-x-2 sm:space-x-3'>
                        <Calendar className='w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0' />
                        <span className='text-sm md:text-base text-gray-500'>
                          Cập nhật lúc:
                        </span>
                      </div>
                      <span className='text-sm font-medium pl-5 sm:pl-0'>
                        {customer.updatedAt
                          ? format(
                              new Date(customer.updatedAt),
                              'HH:mm - dd/MM/yyyy',
                              { locale: vi },
                            )
                          : 'Không có thông tin'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {customer.cus_notes && (
                <div className='space-y-3 sm:space-y-4'>
                  <h3 className='text-lg md:text-xl font-semibold text-gray-900 flex items-center'>
                    <FileText className='w-5 h-5 md:w-6 md:h-6 mr-2' />
                    Ghi chú
                  </h3>
                  <div className='bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200'>
                    <TextRenderer content={customer.cus_notes} />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className='flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200'>
                <Button
                  variant='primary'
                  asChild
                  className='text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-2'
                >
                  <Link to='./edit'>
                    <Edit className='w-4 h-4' />
                    <span className='hidden sm:inline'>
                      Chỉnh sửa thông tin
                    </span>
                    <span className='sm:hidden'>Chỉnh sửa</span>
                  </Link>
                </Button>

                <Button
                  variant='primary'
                  asChild
                  className='text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-2'
                >
                  <Link to={`/erp/cases/new?customerId=${customer?.id || ''}`}>
                    <Plus className='w-4 h-4' />
                    <span className='hidden sm:inline'>Thêm Hồ sơ vụ việc</span>
                    <span className='sm:hidden'>Thêm hồ sơ</span>
                  </Link>
                </Button>

                <Button
                  variant='secondary'
                  asChild
                  className='text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-2'
                >
                  <Link to='/erp/customers'>
                    <ArrowLeft className='w-4 h-4' />
                    <span className='hidden sm:inline'>Quay lại danh sách</span>
                    <span className='sm:hidden'>Quay lại</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      }}
    </Defer>
  );
}
