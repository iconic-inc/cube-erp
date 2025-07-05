import { useFetcher } from '@remix-run/react';
import { format } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import TextInput from '~/components/TextInput';
import { IEmployee } from '~/interfaces/employee.interface';
import { action } from '../profile+';
import Select from '~/widgets/Select';
import PasswordInput from '~/components/PasswordInput';
import ImageInput from '~/components/ImageInput';
import { IImage } from '~/interfaces/image.interface';

export default function EmployeeProfileForm({
  employee,
  formId,
  setIsChanged,
}: {
  employee: IEmployee;
  formId: string;
  setIsChanged: (isChanged: boolean) => void;
}) {
  const user = employee.userId;
  const [avatar, setAvatar] = useState(user?.usr_avatar || ({} as IImage));
  const [username, setUsername] = useState(user?.usr_username || '');
  const [firstName, setFirstName] = useState(user?.usr_firstName || '');
  const [lastName, setLastName] = useState(user?.usr_lastName || '');
  const [email, setEmail] = useState(user?.usr_email || '');
  const [msisdn, setMsisdn] = useState(user?.usr_msisdn || '');
  const [address, setAddress] = useState(user?.usr_address || '');
  const [birthdate, setBirthdate] = useState(
    user?.usr_birthdate
      ? format(new Date(user.usr_birthdate), 'yyyy-MM-dd')
      : '',
  );
  const [sex, setSex] = useState(user?.usr_sex || '');
  const [password, setPassword] = useState('');

  // Check for changes in form
  useEffect(() => {
    setIsChanged(
      firstName !== user?.usr_firstName ||
        lastName !== user?.usr_lastName ||
        email !== user?.usr_email ||
        msisdn !== user?.usr_msisdn ||
        address !== user?.usr_address ||
        birthdate !==
          (user?.usr_birthdate
            ? format(new Date(user.usr_birthdate), 'yyyy-MM-dd')
            : '') ||
        sex !== user?.usr_sex ||
        password !== '' ||
        username !== user?.usr_username,
    );
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
  ]);

  const fetcher = useFetcher<typeof action>();
  const toastIdRef = useRef<any>(null);
  useEffect(() => {
    switch (fetcher.state) {
      case 'submitting':
        toastIdRef.current = toast.loading('Đang cập nhật...', {
          autoClose: false,
        });
        break;

      case 'idle':
        if (fetcher.data && fetcher.data.toast && toastIdRef.current) {
          const { toast: toastData } = fetcher.data as any;
          toast.update(toastIdRef.current, {
            render: toastData.message,
            type: toastData.type || 'success',
            autoClose: 3000,
            isLoading: false,
          });
          toastIdRef.current = null;
          if (toastData.type === 'success') {
            setIsChanged(false);
          }
          // Reset password fields after submission
          setPassword('');
        }
        break;
    }
  }, [fetcher.state]);

  return (
    <fetcher.Form
      id={formId}
      method='PUT'
      className='bg-white rounded-lg shadow-sm p-6 mb-6'
    >
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left Column - Personal Information */}
        <div className='lg:col-span-2'>
          <h2 className='text-lg font-medium mb-4'>Personal Information</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
            <TextInput
              label='Tên'
              value={firstName}
              name='firstName'
              onChange={(e) => setFirstName(e)}
              required
            />

            <TextInput
              label='Họ'
              value={lastName}
              name='lastName'
              onChange={(e) => setLastName(e)}
              required
            />

            <TextInput
              label='Email*'
              value={email}
              name='email'
              onChange={(e) => setEmail(e)}
            />

            <TextInput
              label='Số điện thoại'
              name='msisdn'
              type='tel'
              value={msisdn}
              onChange={(e) => setMsisdn(e)}
              required
            />

            <TextInput
              label='Ngày sinh'
              type='date'
              value={birthdate}
              name='birthdate'
              onChange={(e) => setBirthdate(e)}
              className='w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition'
            />

            <Select
              label='Giới tính'
              value={sex}
              name='sex'
              onChange={(e) => setSex(e.target.value)}
              className='w-full'
            >
              <option value='male'>Nam</option>
              <option value='female'>Nữ</option>
            </Select>

            <div className='md:col-span-2'>
              <TextInput
                label='Địa chỉ'
                name='address'
                type='text'
                value={address}
                onChange={(e) => setAddress(e)}
                placeholder='Địa chỉ'
              />
            </div>
          </div>

          <h2 className='text-lg font-medium mb-4'>Thông tin nhân viên</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
            <TextInput
              label='Employee Code'
              value={employee?.employeeCode}
              name='employeeCode'
              readOnly
              className='bg-gray-100 cursor-not-allowed'
            />

            <TextInput
              label='Phòng ban'
              value={employee?.department}
              name='department'
              readOnly
              className='bg-gray-100 cursor-not-allowed'
            />

            <TextInput
              label='Chức vụ'
              value={employee?.position}
              name='position'
              readOnly
              className='bg-gray-100 cursor-not-allowed'
            />
          </div>

          <h2 className='text-lg font-medium mb-4'>Thông tin đăng nhập</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <TextInput
              label='Username'
              value={username}
              name='username'
              onChange={(e) => setUsername(e)}
            />

            <PasswordInput
              id='currentPassword'
              label='Mật khẩu'
              value={password}
              name='currentPassword'
              onChange={(e) => setPassword(e)}
              placeholder='(Để trống nếu không thay đổi)'
            />

            <div className='md:col-span-2'>
              <div className='flex items-center text-sm'>
                <span className='material-symbols-outlined text-yellow-500 mr-2'>
                  info
                </span>
                <p className='text-gray-600'>
                  Password must be at least 8 characters and include uppercase,
                  lowercase, number and special character.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Photo Upload & Additional Info */}
        <div className='lg:col-span-1'>
          <div className='bg-gray-50 p-6 rounded-lg mb-6'>
            <h2 className='text-lg font-medium mb-4'>Profile Photo</h2>

            <div className='flex flex-col items-center'>
              <div className='w-full'>
                <ImageInput
                  name='avatar'
                  value={avatar}
                  onChange={(e) => setAvatar(e as IImage)}
                  className='mb-4 w-full'
                />
              </div>

              <p className='text-xs text-gray-500 mt-2 text-center'>
                JPEG, PNG or GIF, Maximum size 2MB
              </p>
            </div>
          </div>

          <div className='bg-gray-50 p-6 rounded-lg mb-6'>
            <h2 className='text-lg font-medium mb-4'>Account Status</h2>
            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Status
              </label>
              <div className='flex items-center bg-green-100 text-green-800 px-3 py-2 rounded-md'>
                <span className='material-symbols-outlined text-sm mr-2'>
                  check_circle
                </span>
                <span className='text-sm font-medium'>
                  {user?.usr_status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Access Level
              </label>
              <div className='flex items-center bg-blue-100 text-blue-800 px-3 py-2 rounded-md'>
                <span className='material-symbols-outlined text-sm mr-2'>
                  admin_panel_settings
                </span>
                <span className='text-sm font-medium'>
                  {user?.usr_role?.name || 'Employee'}
                </span>
              </div>
            </div>
          </div>

          <div className='bg-gray-50 p-6 rounded-lg mb-6'>
            <h2 className='text-lg font-medium mb-4'>Account Information</h2>
            <div className='space-y-3'>
              <div>
                <span className='text-sm font-medium text-gray-700 mb-1 mr-2'>
                  Created At:
                </span>
                <span className='text-sm text-gray-600'>
                  {user?.createdAt
                    ? format(new Date(user.createdAt), 'MMM dd, yyyy')
                    : ''}
                </span>
              </div>

              <div>
                <span className='text-sm font-medium text-gray-700 mb-1 mr-2'>
                  Last Updated:
                </span>
                <span className='text-sm text-gray-600'>
                  {user?.updatedAt
                    ? format(new Date(user.updatedAt), 'MMM dd, yyyy')
                    : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </fetcher.Form>
  );
}
