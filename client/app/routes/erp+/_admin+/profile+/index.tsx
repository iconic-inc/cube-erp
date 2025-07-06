import { useFetcher, Link } from '@remix-run/react';
import { ActionFunctionArgs, data as dataResponse } from '@remix-run/node';
import { useState, useMemo, useEffect, useRef } from 'react';
import { Save } from 'lucide-react';
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
      // avatar: data.avatar as string,
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
  // const [avatar, setAvatar] = useState<IImage>(
  //   user?.usr_avatar || ({} as IImage),
  // );
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
    // avatar.id !== user?.usr_avatar?.id;

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
    <div className='space-y-4 md:space-y-6 min-h-screen'>
      {/* Content Header */}
      <ContentHeader
        title='Hồ sơ cá nhân'
        actionContent={
          <>
            <Save className='w-4 h-4 mr-2' />
            Lưu thay đổi
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
          <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white py-6 rounded-t-xl'>
            <CardTitle className='text-white text-3xl font-bold'>
              {employee?.emp_code || 'Hồ sơ cá nhân'}
            </CardTitle>
          </CardHeader>

          <CardContent className='p-6 space-y-6'>
            {/* Personal Information */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2'>
                Thông tin cá nhân
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <Label
                    htmlFor='firstName'
                    className='text-gray-700 font-semibold mb-2 block'
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
                    className={errors.firstName ? 'border-red-500' : ''}
                  />
                  {errors.firstName && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor='lastName'
                    className='text-gray-700 font-semibold mb-2 block'
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
                    className={errors.lastName ? 'border-red-500' : ''}
                  />
                  {errors.lastName && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.lastName}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor='email'
                    className='text-gray-700 font-semibold mb-2 block'
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
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className='text-red-500 text-sm mt-1'>{errors.email}</p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor='msisdn'
                    className='text-gray-700 font-semibold mb-2 block'
                  >
                    Số điện thoại <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    id='msisdn'
                    name='msisdn'
                    type='tel'
                    value={msisdn}
                    onChange={(e) => setMsisdn(e.target.value)}
                    placeholder='Nhập số điện thoại'
                    className={errors.msisdn ? 'border-red-500' : ''}
                  />
                  {errors.msisdn && (
                    <p className='text-red-500 text-sm mt-1'>{errors.msisdn}</p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor='birthdate'
                    className='text-gray-700 font-semibold mb-2 block'
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
                    className='text-gray-700 font-semibold mb-2 block'
                  >
                    Giới tính
                  </Label>
                  <Select value={sex} onValueChange={setSex}>
                    <SelectTrigger>
                      <SelectValue placeholder='Chọn giới tính' />
                    </SelectTrigger>
                    <SelectContent>
                      {sexOptions.map((sexOption) => (
                        <SelectItem
                          key={sexOption.value}
                          value={sexOption.value}
                        >
                          {sexOption.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='col-span-2'>
                  <Label
                    htmlFor='address'
                    className='text-gray-700 font-semibold mb-2 block'
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
                  />
                </div>

                <div>
                  <Label
                    htmlFor='username'
                    className='text-gray-700 font-semibold mb-2 block'
                  >
                    Tên đăng nhập <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    id='username'
                    name='username'
                    type='text'
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder='Nhập tên đăng nhập'
                    className={errors.username ? 'border-red-500' : ''}
                  />
                  {errors.username && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.username}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor='password'
                    className='text-gray-700 font-semibold mb-2 block'
                  >
                    Mật khẩu mới
                  </Label>
                  <Input
                    id='password'
                    name='password'
                    type='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder='Để trống nếu không thay đổi'
                  />
                </div>
              </div>
            </div>

            {/* Employee Information (Read-only) */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2'>
                Thông tin nhân viên
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <Label className='text-gray-700 font-semibold mb-2 block'>
                    Mã nhân viên
                  </Label>
                  <Input
                    value={employee?.emp_code || ''}
                    readOnly
                    className='bg-gray-100 cursor-not-allowed'
                  />
                </div>

                <div>
                  <Label className='text-gray-700 font-semibold mb-2 block'>
                    Phòng ban
                  </Label>
                  <Input
                    value={employee?.emp_department || ''}
                    readOnly
                    className='bg-gray-100 cursor-not-allowed'
                  />
                </div>

                <div>
                  <Label className='text-gray-700 font-semibold mb-2 block'>
                    Chức vụ
                  </Label>
                  <Input
                    value={employee?.emp_position || ''}
                    readOnly
                    className='bg-gray-100 cursor-not-allowed'
                  />
                </div>

                <div>
                  <Label className='text-gray-700 font-semibold mb-2 block'>
                    Trạng thái
                  </Label>
                  <Input
                    value={
                      status === 'active' ? 'Hoạt động' : 'Không hoạt động'
                    }
                    readOnly
                    className='bg-gray-100 cursor-not-allowed'
                  />
                </div>
              </div>
            </div>

            {/* Avatar Section */}
            {/* <div className='space-y-4'>
              <h3 className='text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2'>
                Ảnh đại diện
              </h3>

              <div className='flex flex-col items-center space-y-4'>
                <Avatar className='w-24 h-24'>
                  <AvatarImage
                    src={avatar?.img_url || user?.usr_avatar?.img_url}
                    alt='Avatar'
                  />
                  <AvatarFallback>
                    {firstName?.[0]?.toUpperCase()}
                    {lastName?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <ImageInput
                  name='avatar'
                  value={avatar}
                  onChange={(e) => setAvatar(e as IImage)}
                  className='w-full max-w-md'
                />
              </div>
            </div> */}
          </CardContent>

          <CardFooter>
            <div className='w-full flex justify-between items-center'>
              <Link
                to='/erp'
                className='bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm flex items-center transition-all duration-300'
              >
                <span className='material-symbols-outlined text-sm mr-1'>
                  keyboard_return
                </span>
                Trở về Trang chủ
              </Link>

              <Button
                className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm flex items-center transition-all duration-300 shadow-sm hover:shadow transform hover:-translate-y-0.5'
                type='submit'
                form={formId}
                disabled={!isChanged}
              >
                <Save className='w-4 h-4 mr-2' />
                Cập nhật hồ sơ
              </Button>
            </div>
          </CardFooter>
        </Card>
      </fetcher.Form>
    </div>
  );
}

export const ErrorBoundary = () => <HandsomeError basePath='/erp' />;
