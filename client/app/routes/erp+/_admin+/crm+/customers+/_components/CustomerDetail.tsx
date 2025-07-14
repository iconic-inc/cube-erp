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
            <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white py-6 rounded-t-xl'>
              <div className='flex items-center space-x-4'>
                <div className='w-16 h-16 bg-white/20 rounded-full flex items-center justify-center'>
                  <Users className='w-8 h-8 text-white' />
                </div>
                <div>
                  <CardTitle className='text-white text-3xl font-bold'>
                    {customer.cus_firstName} {customer.cus_lastName}
                  </CardTitle>
                  <p className='text-blue-100 text-lg'>
                    {customer.cus_code || 'Chưa có mã khách hàng'}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className='p-6 space-y-6'>
              {/* Basic Information */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-4'>
                  <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
                    <User className='w-5 h-5 mr-2' />
                    Thông tin cơ bản
                  </h3>

                  <div className='space-y-3'>
                    <div className='flex items-center space-x-3'>
                      <IdCard className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>
                        Mã khách hàng:
                      </span>
                      <span className='text-sm font-medium'>
                        {customer.cus_code || 'Chưa có mã'}
                      </span>
                    </div>

                    <div className='flex items-center space-x-3'>
                      <Phone className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>
                        Số điện thoại:
                      </span>
                      <span className='text-sm font-medium'>
                        {customer.cus_msisdn || 'Chưa có số điện thoại'}
                      </span>
                    </div>

                    <div className='flex items-center space-x-3'>
                      <Mail className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>Email:</span>
                      <span className='text-sm font-medium'>
                        {customer.cus_email || 'Chưa có email'}
                      </span>
                    </div>

                    <div className='flex items-center space-x-3'>
                      <Calendar className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>Ngày sinh:</span>
                      <span className='text-sm font-medium'>
                        {customer.cus_birthDate
                          ? format(
                              new Date(customer.cus_birthDate),
                              'dd/MM/yyyy',
                              { locale: vi },
                            )
                          : 'Chưa có thông tin'}
                      </span>
                    </div>

                    <div className='flex items-center space-x-3'>
                      <User className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>Giới tính:</span>
                      <Badge variant='secondary' className='text-sm'>
                        {customer.cus_sex === 'male'
                          ? 'Nam'
                          : customer.cus_sex === 'female'
                            ? 'Nữ'
                            : 'Chưa có thông tin'}
                      </Badge>
                    </div>

                    <div className='flex items-center space-x-3'>
                      <MapPin className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>Địa chỉ:</span>
                      <span className='text-sm font-medium'>
                        {toAddressString(customer.cus_address)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className='space-y-4'>
                  <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
                    <Users className='w-5 h-5 mr-2' />
                    Thông tin khách hàng
                  </h3>

                  <div className='space-y-3'>
                    <div className='flex items-center space-x-3'>
                      <Phone className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>
                        Kênh liên hệ:
                      </span>
                      <Badge variant='outline' className='text-sm'>
                        {getContactChannelLabel(customer.cus_contactChannel)}
                      </Badge>
                    </div>

                    <div className='flex items-center space-x-3'>
                      <Users className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>Nguồn:</span>
                      <Badge variant='default' className='text-sm'>
                        {getSourceLabel(customer.cus_source)}
                      </Badge>
                    </div>

                    <div className='flex items-center space-x-3'>
                      <Calendar className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>Ngày tạo:</span>
                      <span className='text-sm font-medium'>
                        {customer.cus_createdAt
                          ? format(
                              new Date(customer.cus_createdAt),
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
                <div className='space-y-3'>
                  <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
                    <FileText className='w-5 h-5 mr-2' />
                    Ghi chú
                  </h3>
                  <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
                    <TextRenderer content={customer.cus_notes} />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className='flex flex-wrap gap-3 pt-4 border-t border-gray-200'>
                <Button variant='primary' asChild>
                  <Link to='./edit'>
                    <Edit />
                    Chỉnh sửa thông tin
                  </Link>
                </Button>

                <Button variant='secondary' asChild>
                  <Link to='/erp/crm/customers'>
                    <ArrowLeft />
                    Quay lại danh sách
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
