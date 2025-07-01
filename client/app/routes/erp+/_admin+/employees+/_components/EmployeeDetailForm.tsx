import { toast } from 'react-toastify';
import { useEffect, useRef, useState } from 'react';
import { Link, useFetcher, useNavigate } from '@remix-run/react';

import { ILoaderDataPromise } from '~/interfaces/app.interface';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Button } from '~/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { IEmployee } from '~/interfaces/employee.interface';
import { IRole } from '~/interfaces/role.interface';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import LoadingCard from '~/components/LoadingCard';
import { SelectSearch } from '~/components/ui/SelectSearch';
import TextEditor from '~/components/TextEditor/index.client';
import Hydrated from '~/components/Hydrated';
import { DatePicker } from '~/components/ui/date-picker';

export default function EmployeeDetailForm({
  formId,
  type,
  employeePromise,
  rolesPromise,
  action: actionPath,
}: {
  formId: string;
  type: 'create' | 'update';
  employeePromise?: ILoaderDataPromise<IEmployee>;
  rolesPromise?: ILoaderDataPromise<IRole[]>;
  action?: string;
}) {
  const fetcher = useFetcher({ key: formId });
  const toastIdRef = useRef<any>(null);
  const navigate = useNavigate();

  // Form state
  const [code, setCode] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [msisdn, setMsisdn] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [birthDate, setBirthDate] = useState<Date>(new Date());
  const [sex, setSex] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [position, setPosition] = useState<string>('');
  const [joinDate, setJoinDate] = useState<Date>(new Date());
  const [roleId, setRoleId] = useState<string>('');

  // Control states
  const [employee, setEmployee] = useState<IEmployee | null>(null);
  const [roles, setRoles] = useState<IRole[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isChanged, setIsChanged] = useState(false);
  const [isContentReady, setIsContentReady] = useState(type !== 'update');

  // Generate employee code
  const generateEmployeeCode = () => {
    const timestamp = Date.now().toString().slice(-6);
    const codeGenerated = `NV${timestamp}`;
    setCode(codeGenerated);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation
    const validationErrors: Record<string, string> = {};

    if (!code.trim()) {
      validationErrors.code = 'Vui lòng nhập mã nhân viên';
    }

    if (!firstName.trim()) {
      validationErrors.firstName = 'Vui lòng nhập tên nhân viên';
    }

    if (!lastName.trim()) {
      validationErrors.lastName = 'Vui lòng nhập họ nhân viên';
    }

    if (!email.trim()) {
      validationErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      validationErrors.email = 'Email không hợp lệ';
    }

    if (!msisdn.trim()) {
      validationErrors.msisdn = 'Vui lòng nhập số điện thoại';
    }

    if (!department.trim()) {
      validationErrors.department = 'Vui lòng nhập phòng ban';
    }

    if (!position.trim()) {
      validationErrors.position = 'Vui lòng nhập chức vụ';
    }

    // If there are validation errors, show them and prevent form submission
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Clear errors
    setErrors({});

    // Create FormData
    const formData = new FormData(e.currentTarget);

    formData.set('code', code);
    formData.set('firstName', firstName);
    formData.set('lastName', lastName);
    formData.set('email', email);
    formData.set('msisdn', msisdn);
    formData.set('address', address);
    formData.set('sex', sex);
    formData.set('department', department);
    formData.set('position', position);
    formData.set('roleId', roleId);

    toastIdRef.current = toast.loading('Đang xử lý...');

    // Submit the form
    if (type === 'create') {
      fetcher.submit(formData, { method: 'POST' });
    } else if (type === 'update') {
      fetcher.submit(formData, { method: 'PUT' });
    }
  };

  // Monitor form changes
  useEffect(() => {
    const hasChanged =
      code ||
      firstName ||
      lastName ||
      email ||
      msisdn ||
      address ||
      birthDate ||
      sex ||
      department ||
      position ||
      joinDate ||
      roleId;

    setIsChanged(!!hasChanged);
  }, [
    code,
    firstName,
    lastName,
    email,
    msisdn,
    address,
    birthDate,
    sex,
    department,
    position,
    joinDate,
    roleId,
  ]);

  // Handle fetcher response
  useEffect(() => {
    if (
      fetcher.data &&
      typeof fetcher.data === 'object' &&
      'toast' in fetcher.data
    ) {
      const { toast: toastData } = fetcher.data as any;
      toast.update(toastIdRef.current, {
        type: toastData.type,
        render: toastData.message,
        isLoading: false,
        autoClose: 3000,
        closeOnClick: true,
        pauseOnHover: true,
        pauseOnFocusLoss: true,
      });

      // Redirect if success
      if (
        fetcher.data &&
        typeof fetcher.data === 'object' &&
        'redirectTo' in fetcher.data &&
        fetcher.data.redirectTo
      ) {
        navigate((fetcher.data as any).redirectTo, { replace: true });
      }
    }
  }, [fetcher.data, navigate]);

  // Load employee data when in edit mode
  useEffect(() => {
    if (type === 'update' && employeePromise) {
      const loadEmployee = async () => {
        try {
          const employeeData = await employeePromise;

          if (employeeData && 'emp_code' in employeeData) {
            setEmployee(employeeData);
            setCode(employeeData.emp_code || '');
            setFirstName(employeeData.emp_user.usr_firstName || '');
            setLastName(employeeData.emp_user.usr_lastName || '');
            setEmail(employeeData.emp_user.usr_email || '');
            setMsisdn(employeeData.emp_user.usr_msisdn || '');
            setAddress(employeeData.emp_user.usr_address || '');
            setBirthDate(
              new Date(employeeData.emp_user.usr_birthdate || Date.now()),
            );
            setSex(employeeData.emp_user.usr_sex || '');
            setDepartment(employeeData.emp_department || '');
            setPosition(employeeData.emp_position || '');
            setJoinDate(new Date(employeeData.emp_joinDate || Date.now()));
            setRoleId(employeeData.emp_user.usr_role?.id || '');
          } else {
            console.error(
              'Employee data is not in the expected format:',
              employeeData,
            );
            toast.error(
              'Không thể tải dữ liệu nhân viên. Vui lòng thử lại sau.',
            );
          }
        } catch (error) {
          console.error('Error loading employee data:', error);
          toast.error('Không thể tải dữ liệu nhân viên. Vui lòng thử lại sau.');
        }
      };

      loadEmployee().then(() => {
        setIsContentReady(true);
      });
    }
  }, [type, employeePromise]);

  // Load roles data
  useEffect(() => {
    if (rolesPromise) {
      const loadRoles = async () => {
        try {
          const rolesData = await rolesPromise;
          if (Array.isArray(rolesData)) {
            setRoles(rolesData);
          } else {
            console.error(
              'Roles data is not in the expected format:',
              rolesData,
            );
          }
        } catch (error) {
          console.error('Error loading roles data:', error);
        }
      };

      loadRoles();
    }
  }, [rolesPromise]);

  if (!isContentReady) {
    return <LoadingCard />;
  }

  const sexOptions = [
    { value: 'male', label: 'Nam' },
    { value: 'female', label: 'Nữ' },
    { value: 'other', label: 'Khác' },
  ];

  const roleOptions = roles.map((role) => ({
    value: role.id,
    label: role.name,
  }));

  return (
    <fetcher.Form
      id={formId}
      method={type === 'create' ? 'POST' : 'PUT'}
      action={actionPath}
      onSubmit={handleSubmit}
    >
      <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200'>
        <CardHeader className='bg-gradient-to-r from-green-600 to-emerald-700 text-white py-6 rounded-t-xl'>
          <CardTitle className='text-white text-3xl font-bold'>
            {code || 'Mã nhân viên'}
          </CardTitle>
        </CardHeader>

        <CardContent className='p-6 space-y-6'>
          {/* Employee Code */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <Label
                htmlFor='code'
                className='text-gray-700 font-semibold mb-2 block'
              >
                Mã nhân viên <span className='text-red-500'>*</span>
              </Label>
              <div className='flex gap-2'>
                <Input
                  id='code'
                  type='text'
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder='Nhập mã nhân viên'
                  className={`flex-1 ${errors.code ? 'border-red-500' : ''}`}
                />
                <Button
                  type='button'
                  variant='outline'
                  onClick={generateEmployeeCode}
                  className='px-3'
                >
                  <RotateCcw className='w-4 h-4' />
                </Button>
              </div>
              {errors.code && (
                <p className='text-red-500 text-sm mt-1'>{errors.code}</p>
              )}
            </div>
          </div>

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
                  type='text'
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder='Nhập họ'
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && (
                  <p className='text-red-500 text-sm mt-1'>{errors.lastName}</p>
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
                  initialDate={birthDate}
                  onChange={(date) => setBirthDate(date)}
                  name='birthdate'
                />
              </div>

              <div>
                <Label
                  htmlFor='sex'
                  className='text-gray-700 font-semibold mb-2 block'
                >
                  Giới tính
                </Label>
                <SelectSearch
                  options={sexOptions}
                  placeholder='Chọn giới tính'
                  defaultValue={sex}
                  onValueChange={setSex}
                />
              </div>
            </div>

            <div>
              <Label
                htmlFor='address'
                className='text-gray-700 font-semibold mb-2 block'
              >
                Địa chỉ
              </Label>
              <Input
                id='address'
                type='text'
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder='Nhập địa chỉ'
              />
            </div>
          </div>

          {/* Work Information */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2'>
              Thông tin công việc
            </h3>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <Label
                  htmlFor='department'
                  className='text-gray-700 font-semibold mb-2 block'
                >
                  Phòng ban <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='department'
                  type='text'
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder='Nhập phòng ban'
                  className={errors.department ? 'border-red-500' : ''}
                />
                {errors.department && (
                  <p className='text-red-500 text-sm mt-1'>
                    {errors.department}
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor='position'
                  className='text-gray-700 font-semibold mb-2 block'
                >
                  Chức vụ <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='position'
                  type='text'
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder='Nhập chức vụ'
                  className={errors.position ? 'border-red-500' : ''}
                />
                {errors.position && (
                  <p className='text-red-500 text-sm mt-1'>{errors.position}</p>
                )}
              </div>

              <div>
                <Label
                  htmlFor='joinDate'
                  className='text-gray-700 font-semibold mb-2 block'
                >
                  Ngày vào làm
                </Label>

                <DatePicker
                  id='joinDate'
                  initialDate={joinDate}
                  onChange={(date) => setJoinDate(date)}
                  name='joinDate'
                />
              </div>

              <div>
                <Label
                  htmlFor='roleId'
                  className='text-gray-700 font-semibold mb-2 block'
                >
                  Vai trò
                </Label>
                <SelectSearch
                  options={roleOptions}
                  placeholder='Chọn vai trò'
                  defaultValue={roleId}
                  onValueChange={setRoleId}
                />
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className='bg-gray-50 px-6 py-4'>
          <div className='flex justify-between items-center w-full'>
            <div className='text-sm text-gray-500'>
              <span className='text-red-500'>*</span> Thông tin bắt buộc
            </div>
            <div className='flex space-x-3'>
              <Button
                type='button'
                variant='outline'
                onClick={() => navigate(-1)}
              >
                Hủy
              </Button>
              <Button
                type='submit'
                className='bg-green-600 hover:bg-green-700'
                disabled={!isChanged}
              >
                {type === 'create' ? 'Tạo nhân viên' : 'Cập nhật thông tin'}
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </fetcher.Form>
  );
}
