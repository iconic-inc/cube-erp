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
  Edit,
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
            <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white py-4 sm:py-6 rounded-t-xl'>
              <div className='flex flex-col sm:flex-row items-center sm:items-start space-y-3 sm:space-y-0 sm:space-x-4'>
                <div className='w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0'>
                  {employee.emp_user.usr_avatar?.img_url ? (
                    <img
                      src={employee.emp_user.usr_avatar.img_url}
                      alt={`${employee.emp_user.usr_firstName} ${employee.emp_user.usr_lastName}`}
                      className='w-10 h-10 sm:w-14 sm:h-14 rounded-full object-cover'
                    />
                  ) : (
                    <User className='w-6 h-6 sm:w-8 sm:h-8 text-white' />
                  )}
                </div>
                <div className='text-center sm:text-left'>
                  <CardTitle className='text-white text-xl sm:text-2xl lg:text-3xl font-bold'>
                    {employee.emp_user.usr_firstName}{' '}
                    {employee.emp_user.usr_lastName}
                  </CardTitle>
                  <p className='text-yellow-400 text-base lg:text-lg'>
                    {employee.emp_code || 'Chưa có mã nhân viên'}
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
                          Mã nhân viên:
                        </span>
                      </div>
                      <span className='text-sm md:text-base font-medium pl-5 sm:pl-0'>
                        {employee.emp_code || 'Chưa có mã'}
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
                        {employee.emp_user.usr_msisdn ||
                          'Chưa có số điện thoại'}
                      </span>
                    </div>

                    <div className='flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3'>
                      <div className='flex items-center space-x-2 sm:space-x-3'>
                        <Mail className='w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0' />
                        <span className='text-sm md:text-base text-gray-500'>
                          Email:
                        </span>
                      </div>
                      <span className='text-sm md:text-base font-medium pl-5 sm:pl-0 break-all'>
                        {employee.emp_user.usr_email || 'Chưa có email'}
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
                        {employee.emp_user.usr_birthdate
                          ? format(
                              new Date(employee.emp_user.usr_birthdate),
                              'dd/MM/yyyy',
                              { locale: vi },
                            )
                          : 'Chưa có thông tin'}
                      </span>
                    </div>

                    <div className='flex flex-col sm:flex-row sm:items-start space-y-1 sm:space-y-0 sm:space-x-3'>
                      <div className='flex items-center space-x-2 sm:space-x-3'>
                        <MapPin className='w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0' />
                        <span className='text-sm md:text-base text-gray-500'>
                          Địa chỉ:
                        </span>
                      </div>
                      <span className='text-sm md:text-base font-medium pl-5 sm:pl-0'>
                        {employee.emp_user.usr_address || 'Chưa có địa chỉ'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Work Information */}
                <div className='space-y-3 sm:space-y-4'>
                  <h3 className='text-lg md:text-xl font-semibold text-gray-900 flex items-center'>
                    <Briefcase className='w-5 h-5 md:w-6 md:h-6 mr-2' />
                    Thông tin công việc
                  </h3>

                  <div className='space-y-2 sm:space-y-3'>
                    <div className='flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3'>
                      <div className='flex items-center space-x-2 sm:space-x-3'>
                        <Building className='w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0' />
                        <span className='text-sm md:text-base text-gray-500'>
                          Phòng ban:
                        </span>
                      </div>
                      <Badge
                        variant='secondary'
                        className='w-fit text-sm md:text-base ml-5 sm:ml-0'
                      >
                        {employee.emp_department || 'Chưa có phòng ban'}
                      </Badge>
                    </div>

                    <div className='flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3'>
                      <div className='flex items-center space-x-2 sm:space-x-3'>
                        <Briefcase className='w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0' />
                        <span className='text-sm md:text-base text-gray-500'>
                          Chức vụ:
                        </span>
                      </div>
                      <Badge
                        variant='outline'
                        className='w-fit text-sm md:text-base ml-5 sm:ml-0'
                      >
                        {employee.emp_position || 'Chưa có chức vụ'}
                      </Badge>
                    </div>

                    <div className='flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3'>
                      <div className='flex items-center space-x-2 sm:space-x-3'>
                        <User className='w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0' />
                        <span className='text-sm md:text-base text-gray-500'>
                          Vai trò:
                        </span>
                      </div>
                      <Badge
                        variant='default'
                        className='w-fit text-sm md:text-base ml-5 sm:ml-0'
                      >
                        {employee.emp_user.usr_role?.name || 'Chưa có vai trò'}
                      </Badge>
                    </div>

                    <div className='flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3'>
                      <div className='flex items-center space-x-2 sm:space-x-3'>
                        <Calendar className='w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0' />
                        <span className='text-sm md:text-base text-gray-500'>
                          Ngày vào làm:
                        </span>
                      </div>
                      <span className='text-sm md:text-base font-medium pl-5 sm:pl-0'>
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
              <div className='flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200'>
                <Link
                  to='./edit'
                  className='inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
                >
                  <Edit className='w-4 h-4 md:w-5 md:h-5 mr-2' />
                  <span className='hidden sm:inline'>Chỉnh sửa thông tin</span>
                  <span className='sm:hidden'>Chỉnh sửa</span>
                </Link>

                <Link
                  to='/erp/employees'
                  className='inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 text-base font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors'
                >
                  <span className='hidden sm:inline'>Quay lại danh sách</span>
                  <span className='sm:hidden'>Quay lại</span>
                </Link>
              </div>
            </CardContent>
          </Card>
        );
      }}
    </Defer>
  );
}
