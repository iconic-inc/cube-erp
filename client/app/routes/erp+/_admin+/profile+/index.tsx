import { useFetcher, Link } from '@remix-run/react';
import { ActionFunctionArgs, data as dataResponse } from '@remix-run/node';
import { useState, useMemo, useEffect, useRef } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'react-toastify';

import { isAuthenticated } from '~/services/auth.server';
import HandsomeError from '~/components/HandsomeError';
import { formatDate, generateFormId } from '~/utils';
import ContentHeader from '~/components/ContentHeader';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Label } from '~/components/ui/label';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { useERPLoaderData } from '~/lib';
import { updateMyEmployee } from '~/services/employee.server';
import { DatePicker } from '~/components/ui/date-picker';
import ImageInput from '~/components/ImageInput';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { IImage } from '~/interfaces/image.interface';

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { session: auth, headers } = await isAuthenticated(request);
    if (!auth) {
      throw new Response('Unauthorized', { status: 401 });
    }

    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());
    // Prepare update data
    const updateData = {
      firstName: data.firstName as string,
      lastName: data.lastName as string,
      email: data.email as string,
      msisdn: data.msisdn as string,
      address: data.address as string,
      sex: data.sex as string,
      birthdate: data.birthdate as string,
      username: data.username as string,
      password: data.password as string,
      avatar: data.avatar as string,
    };

    const updatedEmployee = await updateMyEmployee(updateData, auth!);
    return dataResponse(
      {
        employee: updatedEmployee,
        toast: { message: 'Cập nhật thông tin thành công!', type: 'success' },
      },
      { headers },
    );
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return {
      toast: {
        message: error.message || error.statusText || 'Cập nhật thất bại!',
        type: 'error',
      },
    };
  }
};

export default function HRMProfile() {
  const { employee } = useERPLoaderData();
  const user = employee?.emp_user;
  const fetcher = useFetcher<typeof action>();
  const toastIdRef = useRef<any>(null);

  const formId = useMemo(() => generateFormId('admin-profile-form'), []);

  // Form state
  const [avatar, setAvatar] = useState<IImage>(
    user?.usr_avatar || ({} as IImage),
  );
  const [username, setUsername] = useState(user?.usr_username || '');
  const [firstName, setFirstName] = useState(user?.usr_firstName || '');
  const [lastName, setLastName] = useState(user?.usr_lastName || '');
  const [email, setEmail] = useState(user?.usr_email || '');
  const [msisdn, setMsisdn] = useState(user?.usr_msisdn || '');
  const [address, setAddress] = useState(user?.usr_address || '');
  const [birthdate, setBirthdate] = useState(
    new Date(user?.usr_birthdate || Date.now()),
  );
  const [sex, setSex] = useState(user?.usr_sex || '');
  const [password, setPassword] = useState('');

  // Status from user data (read-only for profile)
  const status = user?.usr_status || 'active';

  // Options
  const sexOptions = [
    { value: 'male', label: 'Nam' },
    { value: 'female', label: 'Nữ' },
    { value: 'other', label: 'Khác' },
  ];

  // State management
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isChanged, setIsChanged] = useState(false);

  // Track changes
  useEffect(() => {
    const hasChanged =
      firstName !== user?.usr_firstName ||
      lastName !== user?.usr_lastName ||
      email !== user?.usr_email ||
      msisdn !== user?.usr_msisdn ||
      address !== user?.usr_address ||
      formatDate(birthdate) !==
        formatDate(new Date(user?.usr_birthdate || Date.now())) ||
      sex !== user?.usr_sex ||
      password !== '' ||
      username !== user?.usr_username;
    avatar.id !== user?.usr_avatar?.id;

    setIsChanged(hasChanged);
  }, [
    firstName,
    lastName,
    email,
    msisdn,
    address,
    birthdate,
    sex,
    password,
    username,
    user,
    avatar.id,
  ]);

  // Form submission handler
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation
    const validationErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      validationErrors.firstName = 'Vui lòng nhập tên';
    }

    if (!lastName.trim()) {
      validationErrors.lastName = 'Vui lòng nhập họ';
    }

    if (!email.trim()) {
      validationErrors.email = 'Vui lòng nhập email';
    }

    if (!username.trim()) {
      validationErrors.username = 'Vui lòng nhập tên đăng nhập';
    }

    // If there are validation errors, show them and prevent form submission
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error(Object.values(validationErrors)[0]);
      return;
    }

    // Clear errors
    setErrors({});

    // Create FormData
    const formData = new FormData(e.currentTarget);

    // Add user ID
    if (user?.id) {
      formData.append('id', user.id);
    }

    toastIdRef.current = toast.loading('Đang cập nhật...');

    // Submit the form
    fetcher.submit(formData, { method: 'PUT' });
  };

  // Handle toast notifications
  useEffect(() => {
    if (fetcher.data?.toast) {
      const { toast: toastData } = fetcher.data;
      toast.update(toastIdRef.current, {
        type: toastData.type as any,
        render: toastData.message,
        isLoading: false,
        autoClose: 3000,
        closeOnClick: true,
        pauseOnHover: true,
        pauseOnFocusLoss: true,
      });

      // Reset password and mark as unchanged if success
      if (toastData.type === 'success') {
        setPassword('');
        setIsChanged(false);
      }
    }
  }, [fetcher.data]);

  return (
    <div className='space-y-4 sm:space-y-6 min-h-screen'>
      {/* Content Header */}
      <ContentHeader
        title='Hồ sơ cá nhân'
        actionContent={
          <>
            <Save className='w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2' />
            <span className='hidden sm:inline'>Lưu thay đổi</span>
            <span className='sm:hidden'>Lưu</span>
          </>
        }
        actionHandler={() => {
          const form = globalThis.document.getElementById(
            formId,
          ) as HTMLFormElement;
          if (form) {
            form.requestSubmit();
          }
        }}
      />

      {/* Form Container */}
      <fetcher.Form id={formId} method='PUT' onSubmit={handleSubmit}>
        <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200'>
          <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white p-3 sm:p-6 rounded-t-xl'>
            <CardTitle className='text-white text-xl sm:text-3xl font-bold'>
              <span className='hidden sm:inline'>
                {employee?.emp_code || 'Hồ sơ cá nhân'}
              </span>
              <span className='sm:hidden'>{employee?.emp_code || 'Hồ sơ'}</span>
            </CardTitle>
          </CardHeader>

          <CardContent className='p-3 sm:p-6 space-y-4 sm:space-y-6'>
            {/* Avatar Section */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2'>
                Ảnh đại diện
              </h3>

              <div className='flex flex-col items-center space-y-4'>
                <ImageInput
                  name='avatar'
                  value={avatar}
                  onChange={(e) => setAvatar(e as IImage)}
                  className='w-full max-w-md'
                />
              </div>
            </div>
            {/* Personal Information */}
            <div className='space-y-3 sm:space-y-4'>
              <h3 className='text-base sm:text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2'>
                <span className='hidden sm:inline'>Thông tin cá nhân</span>
                <span className='sm:hidden'>Thông tin</span>
              </h3>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6'>
                <div>
                  <Label
                    htmlFor='firstName'
                    className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'
                  >
                    Tên <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    id='firstName'
                    name='firstName'
                    type='text'
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder='Nhập tên'
                    className={`text-sm sm:text-base ${errors.firstName ? 'border-red-500' : ''}`}
                  />
                  {errors.firstName && (
                    <p className='text-red-500 text-xs sm:text-sm mt-1'>
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor='lastName'
                    className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'
                  >
                    Họ <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    id='lastName'
                    name='lastName'
                    type='text'
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder='Nhập họ'
                    className={`text-sm sm:text-base ${errors.lastName ? 'border-red-500' : ''}`}
                  />
                  {errors.lastName && (
                    <p className='text-red-500 text-xs sm:text-sm mt-1'>
                      {errors.lastName}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor='email'
                    className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'
                  >
                    Email <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    id='email'
                    name='email'
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder='Nhập email'
                    className={`text-sm sm:text-base ${errors.email ? 'border-red-500' : ''}`}
                  />
                  {errors.email && (
                    <p className='text-red-500 text-xs sm:text-sm mt-1'>
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor='msisdn'
                    className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'
                  >
                    <span className='hidden sm:inline'>Số điện thoại</span>
                    <span className='sm:hidden'>SĐT</span>{' '}
                    <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    id='msisdn'
                    name='msisdn'
                    type='tel'
                    value={msisdn}
                    onChange={(e) => setMsisdn(e.target.value)}
                    placeholder='Nhập số điện thoại'
                    className={`text-sm sm:text-base ${errors.msisdn ? 'border-red-500' : ''}`}
                  />
                  {errors.msisdn && (
                    <p className='text-red-500 text-xs sm:text-sm mt-1'>
                      {errors.msisdn}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor='birthdate'
                    className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'
                  >
                    Ngày sinh
                  </Label>
                  <DatePicker
                    id='birthdate'
                    name='birthdate'
                    initialDate={birthdate}
                    onChange={(e) => setBirthdate(e)}
                  />
                </div>

                <div>
                  <Label
                    htmlFor='sex'
                    className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'
                  >
                    Giới tính
                  </Label>
                  <Select value={sex} onValueChange={setSex}>
                    <SelectTrigger className='text-sm sm:text-base'>
                      <SelectValue placeholder='Chọn giới tính' />
                    </SelectTrigger>
                    <SelectContent>
                      {sexOptions.map((sexOption) => (
                        <SelectItem
                          key={sexOption.value}
                          value={sexOption.value}
                          className='text-sm sm:text-base'
                        >
                          {sexOption.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='sm:col-span-2'>
                  <Label
                    htmlFor='address'
                    className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'
                  >
                    Địa chỉ
                  </Label>
                  <Input
                    id='address'
                    name='address'
                    type='text'
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder='Nhập địa chỉ'
                    className='text-sm sm:text-base'
                  />
                </div>

                <div>
                  <Label
                    htmlFor='username'
                    className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'
                  >
                    <span className='hidden sm:inline'>Tên đăng nhập</span>
                    <span className='sm:hidden'>Username</span>{' '}
                    <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    id='username'
                    name='username'
                    type='text'
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder='Nhập tên đăng nhập'
                    className={`text-sm sm:text-base ${errors.username ? 'border-red-500' : ''}`}
                  />
                  {errors.username && (
                    <p className='text-red-500 text-xs sm:text-sm mt-1'>
                      {errors.username}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor='password'
                    className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'
                  >
                    <span className='hidden sm:inline'>Mật khẩu mới</span>
                    <span className='sm:hidden'>Mật khẩu</span>
                  </Label>
                  <Input
                    id='password'
                    name='password'
                    type='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder='Để trống nếu không thay đổi'
                    className='text-sm sm:text-base'
                  />
                </div>
              </div>
            </div>

            {/* Employee Information (Read-only) */}
            <div className='space-y-3 sm:space-y-4'>
              <h3 className='text-base sm:text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2'>
                <span className='hidden sm:inline'>Thông tin nhân viên</span>
                <span className='sm:hidden'>Nhân viên</span>
              </h3>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6'>
                <div>
                  <Label className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'>
                    <span className='hidden sm:inline'>Mã nhân viên</span>
                    <span className='sm:hidden'>Mã NV</span>
                  </Label>
                  <Input
                    value={employee?.emp_code || ''}
                    readOnly
                    className='bg-gray-100 cursor-not-allowed text-sm sm:text-base'
                  />
                </div>

                <div>
                  <Label className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'>
                    Phòng ban
                  </Label>
                  <Input
                    value={employee?.emp_department || ''}
                    readOnly
                    className='bg-gray-100 cursor-not-allowed text-sm sm:text-base'
                  />
                </div>

                <div>
                  <Label className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'>
                    Chức vụ
                  </Label>
                  <Input
                    value={employee?.emp_position || ''}
                    readOnly
                    className='bg-gray-100 cursor-not-allowed text-sm sm:text-base'
                  />
                </div>

                <div>
                  <Label className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'>
                    Trạng thái
                  </Label>
                  <Input
                    value={
                      status === 'active' ? 'Hoạt động' : 'Không hoạt động'
                    }
                    readOnly
                    className='bg-gray-100 cursor-not-allowed text-sm sm:text-base'
                  />
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className='p-3 sm:p-6'>
            <div className='w-full flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0'>
              <Link
                to='/erp'
                className='bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm flex items-center transition-all duration-300 w-full sm:w-auto justify-center sm:justify-start'
              >
                <ArrowLeft className='h-4 w-4 mr-1' />
                <span className='hidden sm:inline'>Trở về Trang chủ</span>
                <span className='sm:hidden'>Trang chủ</span>
              </Link>

              <Button
                className='bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm flex items-center transition-all duration-300 shadow-sm hover:shadow transform hover:-translate-y-0.5 w-full sm:w-auto justify-center'
                type='submit'
                form={formId}
                disabled={!isChanged}
              >
                <Save className='h-4 w-4' />
                <span className='hidden sm:inline'>Cập nhật hồ sơ</span>
                <span className='sm:hidden'>Cập nhật</span>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </fetcher.Form>
    </div>
  );
}

export const ErrorBoundary = () => <HandsomeError basePath='/erp' />;
