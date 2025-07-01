import { Link } from '@remix-run/react';
import Defer from '~/components/Defer';
import LoadingCard from '~/components/LoadingCard';
import ErrorCard from '~/components/ErrorCard';
import { IEmployee } from '~/interfaces/employee.interface';
import { ILoaderDataPromise } from '~/interfaces/app.interface';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  IdCard,
  Building,
  Briefcase,
} from 'lucide-react';

export default function EmployeeDetail({
  employeePromise,
}: {
  employeePromise: ILoaderDataPromise<IEmployee>;
}) {
  return (
    <Defer resolve={employeePromise} fallback={<LoadingCard />}>
      {(employee) => {
        if (!employee || 'success' in employee) {
          return (
            <ErrorCard
              message={
                employee &&
                'message' in employee &&
                typeof employee.message === 'string'
                  ? employee.message
                  : 'Đã xảy ra lỗi khi tải dữ liệu nhân viên'
              }
            />
          );
        }

        return (
          <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200'>
            <CardHeader className='bg-gradient-to-r from-green-600 to-emerald-700 text-white py-6 rounded-t-xl'>
              <div className='flex items-center space-x-4'>
                <div className='w-16 h-16 bg-white/20 rounded-full flex items-center justify-center'>
                  {employee.emp_user.usr_avatar?.img_url ? (
                    <img
                      src={employee.emp_user.usr_avatar.img_url}
                      alt={`${employee.emp_user.usr_firstName} ${employee.emp_user.usr_lastName}`}
                      className='w-14 h-14 rounded-full object-cover'
                    />
                  ) : (
                    <User className='w-8 h-8 text-white' />
                  )}
                </div>
                <div>
                  <CardTitle className='text-white text-3xl font-bold'>
                    {employee.emp_user.usr_firstName}{' '}
                    {employee.emp_user.usr_lastName}
                  </CardTitle>
                  <p className='text-green-100 text-lg'>
                    {employee.emp_code || 'Chưa có mã nhân viên'}
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
                        Mã nhân viên:
                      </span>
                      <span className='text-sm font-medium'>
                        {employee.emp_code || 'Chưa có mã'}
                      </span>
                    </div>

                    <div className='flex items-center space-x-3'>
                      <Phone className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>
                        Số điện thoại:
                      </span>
                      <span className='text-sm font-medium'>
                        {employee.emp_user.usr_msisdn ||
                          'Chưa có số điện thoại'}
                      </span>
                    </div>

                    <div className='flex items-center space-x-3'>
                      <Mail className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>Email:</span>
                      <span className='text-sm font-medium'>
                        {employee.emp_user.usr_email || 'Chưa có email'}
                      </span>
                    </div>

                    <div className='flex items-center space-x-3'>
                      <Calendar className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>Ngày sinh:</span>
                      <span className='text-sm font-medium'>
                        {employee.emp_user.usr_birthdate
                          ? format(
                              new Date(employee.emp_user.usr_birthdate),
                              'dd/MM/yyyy',
                              { locale: vi },
                            )
                          : 'Chưa có thông tin'}
                      </span>
                    </div>

                    <div className='flex items-center space-x-3'>
                      <MapPin className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>Địa chỉ:</span>
                      <span className='text-sm font-medium'>
                        {employee.emp_user.usr_address || 'Chưa có địa chỉ'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Work Information */}
                <div className='space-y-4'>
                  <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
                    <Briefcase className='w-5 h-5 mr-2' />
                    Thông tin công việc
                  </h3>

                  <div className='space-y-3'>
                    <div className='flex items-center space-x-3'>
                      <Building className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>Phòng ban:</span>
                      <Badge variant='secondary' className='text-sm'>
                        {employee.emp_department || 'Chưa có phòng ban'}
                      </Badge>
                    </div>

                    <div className='flex items-center space-x-3'>
                      <Briefcase className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>Chức vụ:</span>
                      <Badge variant='outline' className='text-sm'>
                        {employee.emp_position || 'Chưa có chức vụ'}
                      </Badge>
                    </div>

                    <div className='flex items-center space-x-3'>
                      <User className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>Vai trò:</span>
                      <Badge variant='default' className='text-sm'>
                        {employee.emp_user.usr_role?.name || 'Chưa có vai trò'}
                      </Badge>
                    </div>

                    <div className='flex items-center space-x-3'>
                      <Calendar className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>
                        Ngày vào làm:
                      </span>
                      <span className='text-sm font-medium'>
                        {employee.emp_joinDate
                          ? format(
                              new Date(employee.emp_joinDate),
                              'dd/MM/yyyy',
                              { locale: vi },
                            )
                          : 'Không có thông tin'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className='flex flex-wrap gap-3 pt-4 border-t border-gray-200'>
                <Link
                  to='./edit'
                  className='inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                >
                  <User className='w-4 h-4 mr-2' />
                  Chỉnh sửa thông tin
                </Link>

                <Link
                  to='/erp/employees'
                  className='inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
                >
                  Quay lại danh sách
                </Link>
              </div>
            </CardContent>
          </Card>
        );
      }}
    </Defer>
  );
}
