import { toast } from 'react-toastify';
import { useEffect, useRef, useState } from 'react';
import { useFetcher, useNavigate } from '@remix-run/react';

import { action } from '~/routes/erp+/_admin+/employees+/new';
import ImageInput from '~/components/ImageInput';
import PasswordInput from '~/components/PasswordInput';
import TextInput from '~/components/TextInput';
import { IEmployee } from '~/interfaces/employee.interface';
import { IRole } from '~/interfaces/role.interface';
import { format } from 'date-fns';

export default function EmployeeDetailForm({
  formId,
  employee,
  roles,
  setIsChanged,
  type,
}: {
  formId: string;
  employee?: IEmployee;
  roles: IRole[];
  setIsChanged: (value: boolean) => void;
  type: 'create' | 'update';
}) {
  const fetcher = useFetcher<typeof action>({ key: formId });
  const navigate = useNavigate();

  const [avatar, setAvatar] = useState(
    employee?.emp_user.usr_avatar || ({} as any),
  );
  const [firstName, setFirstName] = useState(
    employee?.emp_user.usr_firstName || '',
  );
  const [lastName, setLastName] = useState(
    employee?.emp_user.usr_lastName || '',
  );
  const [email, setEmail] = useState(employee?.emp_user.usr_email || '');
  const [msisdn, setMsisdn] = useState(employee?.emp_user.usr_msisdn || '');
  const [address, setAddress] = useState(employee?.emp_user.usr_address || '');
  const [sex, setSex] = useState(employee?.emp_user.usr_sex || '');
  const [username, setUsername] = useState(
    employee?.emp_user.usr_username || '',
  );
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(employee?.emp_user.usr_role);
  const [status, setStatus] = useState(
    employee?.emp_user.usr_status || 'active',
  );
  const [birhtdate, setBirthdate] = useState(
    format(
      new Date(employee?.emp_user.usr_birthdate || Date.now()),
      'yyyy-MM-dd',
    ),
  );

  const [employeeCode, setEmployeeCode] = useState(
    employee?.emp_code || 'EMP-',
  );
  const [joinDate, setJoinDate] = useState(
    format(new Date(employee?.emp_joinDate || Date.now()), 'yyyy-MM-dd'),
  );
  const [position, setPosition] = useState(employee?.emp_position || '');
  const [department, setDepartment] = useState(employee?.emp_department || '');

  // Thêm state để theo dõi lỗi
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setIsChanged(
      avatar?.id !== employee?.emp_user.usr_avatar?.id ||
        firstName !== employee?.emp_user.usr_firstName ||
        lastName !== employee?.emp_user.usr_lastName ||
        email !== employee?.emp_user.usr_email ||
        msisdn !== employee?.emp_user.usr_msisdn ||
        address !== employee?.emp_user.usr_address ||
        username !== employee?.emp_user.usr_username ||
        password !== '' ||
        role?.id !== employee?.emp_user.usr_role?.id ||
        status !== employee?.emp_user.usr_status ||
        birhtdate !== employee?.emp_user.usr_birthdate ||
        employeeCode !== employee?.emp_code ||
        joinDate !== employee?.emp_joinDate ||
        position !== employee?.emp_position ||
        department !== employee?.emp_department,
    );
  }, [
    avatar,
    firstName,
    lastName,
    email,
    msisdn,
    address,
    sex,
    username,
    password,
    role,
    status,
    birhtdate,
    employeeCode,
    joinDate,
    position,
    department,
  ]);

  const toastIdRef = useRef<any>(null);

  useEffect(() => {
    switch (fetcher.state) {
      case 'submitting':
        toastIdRef.current = toast.loading('Đang xử lý...', {
          autoClose: false,
        });
        // Xóa lỗi khi bắt đầu submit
        setErrors({});
        break;

      case 'idle':
        if (fetcher.data?.toast && toastIdRef.current) {
          const { toast: toastData } = fetcher.data;
          toast.update(toastIdRef.current, {
            render: toastData.message,
            type: toastData.type || 'success', // Default to 'success' if type is not provided
            autoClose: 3000,
            isLoading: false,
          });
          setIsChanged(false);
          toastIdRef.current = null;

          setPassword('');
          if (type === 'create' && toastData.type === 'success') {
            navigate(`/erp/employees/${fetcher.data.employee?.id}`);
          }

          break;
        }

        // Xử lý lỗi
        if (fetcher.data?.toast?.type === 'error') {
          toast.update(toastIdRef.current, {
            render: fetcher.data?.toast.message,
            autoClose: 3000,
            isLoading: false,
            type: 'error',
          });

          // Nếu có lỗi validation, hiển thị trong form
          if (fetcher.data?.toast.message.includes('thông tin bắt buộc')) {
            const newErrors: Record<string, string> = {};
            if (!employeeCode)
              newErrors.employeeCode = 'Mã nhân viên là bắt buộc';
            if (!firstName) newErrors.firstName = 'Tên là bắt buộc';
            if (!lastName) newErrors.lastName = 'Họ là bắt buộc';
            if (!email) newErrors.email = 'Email là bắt buộc';
            if (!role?.id) newErrors.role = 'Quyền truy cập là bắt buộc';
            if (!password) newErrors.password = 'Mật khẩu là bắt buộc';
            if (password && password.length < 8)
              newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';

            setErrors(newErrors);
          }
        }
        break;
    }
  }, [fetcher.state, fetcher.data]);

  return (
    <fetcher.Form
      id={formId}
      method={type === 'create' ? 'POST' : 'PUT'}
      className='grid grid-cols-1 lg:grid-cols-3 gap-6'
    >
      {/* Left Column - Personal Information */}
      <div className='lg:col-span-2'>
        <h2 className='text-lg font-medium mb-4'>Thông tin Cá nhân</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
          <div>
            <label
              className='block text-sm font-medium text-gray-700 mb-1'
              htmlFor='emp-firstname'
            >
              Tên*
            </label>
            <input
              id='emp-firstname'
              type='text'
              name='firstName'
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={`w-full border ${
                errors.firstName ? 'border-red-500' : 'border-gray-300'
              } rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
            />
            {errors.firstName && (
              <p className='text-red-500 text-xs mt-1'>{errors.firstName}</p>
            )}
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Họ*
            </label>
            <input
              type='text'
              name='lastName'
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={`w-full border ${
                errors.lastName ? 'border-red-500' : 'border-gray-300'
              } rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
            />
            {errors.lastName && (
              <p className='text-red-500 text-xs mt-1'>{errors.lastName}</p>
            )}
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Email*
            </label>
            <input
              type='email'
              name='email'
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full border ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              } rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
            />
            {errors.email && (
              <p className='text-red-500 text-xs mt-1'>{errors.email}</p>
            )}
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Số Điện thoại*
            </label>
            <input
              type='tel'
              name='msisdn'
              required
              value={msisdn}
              onChange={(e) => setMsisdn(e.target.value)}
              className='w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Ngày sinh
            </label>
            <input
              type='date'
              name='birthdate'
              value={birhtdate}
              onChange={(e) => setBirthdate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className='w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Giới tính
            </label>

            <select
              value={sex}
              onChange={(e) => setSex(e.target.value)}
              className='w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition'
              name='sex'
            >
              <option value='' disabled>
                Chọn giới tính
              </option>
              <option value='male'>Nam</option>
              <option value='female'>Nữ</option>
            </select>
          </div>

          <div className='md:col-span-2'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Địa chỉ
            </label>

            <input
              type='text'
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className='w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition'
              placeholder='Địa chỉ'
              name='address'
            />
          </div>
        </div>

        <h2 className='text-lg font-medium mb-4'>Thông tin Công việc</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Mã Nhân sự*
            </label>

            <input
              type='text'
              name='employeeCode'
              required
              value={employeeCode}
              onChange={(e) => setEmployeeCode(e.target.value)}
              className={`w-full border ${
                errors.employeeCode ? 'border-red-500' : 'border-gray-300'
              } rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
              placeholder='EMP-'
            />
            {errors.employeeCode && (
              <p className='text-red-500 text-xs mt-1'>{errors.employeeCode}</p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Ngày gia nhập*
            </label>

            <input
              type='date'
              name='joinDate'
              required
              value={joinDate}
              onChange={(e) => setJoinDate(e.target.value)}
              className='w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Phòng ban*
            </label>

            <select
              name='department'
              required
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className='w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition'
            >
              <option value='' disabled>
                Chọn phòng ban
              </option>
              <option value='engineering'>Kỹ thuật</option>
              <option value='marketing'>Marketing</option>
              <option value='cskh'>CSKH</option>
              <option value='media'>Media</option>
              <option value='operations'>Vận hành</option>
              <option value='expert'>Chuyên gia</option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Chức vụ*
            </label>

            <input
              type='text'
              name='position'
              required
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className='w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition'
            />
          </div>
        </div>
      </div>

      {/* Right Column - Photo Upload & Additional Info */}
      <div className='lg:col-span-1'>
        <div className='flex flex-col items-center bg-gray-50 p-6 rounded-lg mb-6'>
          <h2 className='text-lg font-medium mb-4'>Ảnh Hồ sơ</h2>

          <div className='w-full'>
            <ImageInput
              name='avatar'
              value={avatar}
              onChange={(value) =>
                Array.isArray(value) ? setAvatar(value[0]) : setAvatar(value)
              }
            />
          </div>
        </div>

        <div className='bg-gray-50 p-6 rounded-lg mb-6'>
          <h2 className='text-lg font-medium mb-4'>Trạng thái Tài khoản</h2>

          <TextInput
            name='username'
            label='Username*'
            value={username}
            onChange={setUsername}
            placeholder='Username'
            className='mb-4'
          />

          <PasswordInput
            id='password'
            name='password'
            label={
              <span>
                Mật khẩu <span className='text-red-500'>*</span>
              </span>
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder='Nhập mật khẩu mới'
            className='mb-4'
          />
        </div>

        <div className='bg-gray-50 p-6 rounded-lg mb-6'>
          <h2 className='text-lg font-medium mb-4'>Trạng thái Tài khoản</h2>

          <div className='mb-4'>
            <label
              className='block text-sm font-medium text-gray-700 mb-1'
              htmlFor='emp-status'
            >
              Trạng thái
            </label>

            <select
              id='emp-status'
              name='status'
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className='w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition'
            >
              <option value='active'>Hoạt động</option>
              <option value='inactive'>Không hoạt động</option>
            </select>
          </div>

          <div>
            <label
              className='block text-sm font-medium text-gray-700 mb-1'
              htmlFor='emp-role'
            >
              Quyền Truy cập*
            </label>

            <select
              id='emp-role'
              name='role'
              value={role?.id || roles[0]?.id}
              onChange={(e) => {
                const selectedRole = roles.find((r) => r.id === e.target.value);
                setRole(selectedRole || roles[0]);
                console.log('Selected role:', selectedRole);
              }}
              required
              className={`w-full border ${
                errors.role ? 'border-red-500' : 'border-gray-300'
              } rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
            >
              <option value='' disabled>
                Chọn quyền truy cập
              </option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            {errors.role && (
              <p className='text-red-500 text-xs mt-1'>{errors.role}</p>
            )}
          </div>
        </div>
      </div>
    </fetcher.Form>
  );
}
