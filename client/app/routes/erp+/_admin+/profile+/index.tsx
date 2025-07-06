import { useLoaderData, useFetcher, Link } from '@remix-run/react';
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  data as dataResponse,
} from '@remix-run/node';
import { useState, useMemo, useEffect, useRef } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

import { isAuthenticated } from '~/services/auth.server';
import HandsomeError from '~/components/HandsomeError';
import { getCurrentUser, updateUser } from '~/services/user.server';
import { parseAuthCookie } from '~/services/cookie.server';
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
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import ImageInput from '~/components/ImageInput';
import { IImage } from '~/interfaces/image.interface';
import { DatePicker } from '~/components/ui/date-picker';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const auth = await parseAuthCookie(request);

  const user = await getCurrentUser(auth!);
  return {
    user,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { session: auth, headers } = await isAuthenticated(request);
    if (!auth) {
      throw new Response('Unauthorized', { status: 401 });
    }

    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());

    // Extract ID
    const id = data.id as string;
    delete data.id;

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

    const updatedEmployee = await updateUser(auth?.user.id, updateData, auth!);
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
  const { user } = useLoaderData<typeof loader>();
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
    new Date(user.usr_birthdate || Date.now()),
  );
  const [sex, setSex] = useState(user?.usr_sex || '');
  const [password, setPassword] = useState('');

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
        (user?.usr_birthdate
          ? formatDate(new Date(user.usr_birthdate))
          : formatDate(new Date())) ||
      sex !== user?.usr_sex ||
      password !== '' ||
      username !== user?.usr_username ||
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
    avatar.id,
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
    formData.append('id', user.id);

    // Add avatar if changed
    if (avatar.id && avatar.id !== user?.usr_avatar?.id) {
      formData.append('avatar', avatar.id);
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
            <CardTitle className='text-white text-3xl font-bold flex items-center space-x-4'>
              {/* <Avatar className='h-16 w-16 border-4 border-white'>
                <AvatarImage
                  src={avatar?.img_url || user?.usr_avatar?.img_url}
                  alt={`${firstName} ${lastName} Avatar`}
                />
                <AvatarFallback className='text-blue-900 text-xl font-bold'>
                  {firstName?.[0]}
                  {lastName?.[0]}
                </AvatarFallback>
              </Avatar> */}
              <div>
                <div>
                  {firstName} {lastName}
                </div>
                <div className='text-blue-100 text-lg font-normal'>
                  @{username}
                </div>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className='p-6 space-y-6'>
            {/* Avatar Upload */}
            {/* <div>
              <Label className='text-gray-700 font-semibold mb-2 block'>
                Ảnh đại diện
              </Label>
              <ImageInput
                value={avatar}
                onChange={(value) =>
                  setAvatar(Array.isArray(value) ? value[0] : value)
                }
                name='avatar'
                className='w-32 h-32 rounded-full'
              />
            </div> */}

            {/* Personal Information */}
            <div>
              <h3 className='text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2'>
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
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className='bg-white border-gray-300'
                    placeholder='Nhập tên'
                    required
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
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className='bg-white border-gray-300'
                    placeholder='Nhập họ'
                    required
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
                    className='bg-white border-gray-300'
                    placeholder='Nhập email'
                    required
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
                    Số điện thoại
                  </Label>
                  <Input
                    id='msisdn'
                    name='msisdn'
                    type='tel'
                    value={msisdn}
                    onChange={(e) => setMsisdn(e.target.value)}
                    className='bg-white border-gray-300'
                    placeholder='Nhập số điện thoại'
                  />
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
                    onChange={(value) => setBirthdate(value)}
                  />
                </div>

                <div>
                  <Label
                    htmlFor='sex'
                    className='text-gray-700 font-semibold mb-2 block'
                  >
                    Giới tính
                  </Label>
                  <Select name='sex' value={sex} onValueChange={setSex}>
                    <SelectTrigger>
                      <SelectValue placeholder='Chọn giới tính' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='male'>Nam</SelectItem>
                      <SelectItem value='female'>Nữ</SelectItem>
                      <SelectItem value='other'>Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className='mt-6'>
                <Label
                  htmlFor='address'
                  className='text-gray-700 font-semibold mb-2 block'
                >
                  Địa chỉ
                </Label>
                <Input
                  id='address'
                  name='address'
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className='bg-white border-gray-300'
                  placeholder='Nhập địa chỉ'
                />
              </div>
            </div>

            {/* Account Information */}
            <div className='border-t border-gray-200 pt-6'>
              <h3 className='text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2'>
                Thông tin tài khoản
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
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
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className='bg-white border-gray-300'
                    placeholder='Nhập tên đăng nhập'
                    required
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
                    Mật khẩu mới (Tùy chọn)
                  </Label>
                  <Input
                    id='password'
                    name='password'
                    type='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className='bg-white border-gray-300'
                    placeholder='Nhập mật khẩu mới'
                  />
                  {password && (
                    <p className='text-gray-500 text-sm mt-1'>
                      Để trống nếu không muốn thay đổi mật khẩu
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className='bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-200'>
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
              type='submit'
              disabled={!isChanged || fetcher.state === 'submitting'}
            >
              {fetcher.state === 'submitting' ? (
                <>
                  <span className='animate-spin mr-2'>⏳</span>
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className='w-4 h-4 mr-2' />
                  <span>Lưu thay đổi</span>
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </fetcher.Form>
    </div>
  );
}

export const ErrorBoundary = () => <HandsomeError basePath='/erp' />;
