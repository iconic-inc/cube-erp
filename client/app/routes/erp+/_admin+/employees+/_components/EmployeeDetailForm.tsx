import { toast } from 'react-toastify';
import { useEffect, useRef, useState } from 'react';
import { Link, useFetcher, useNavigate } from '@remix-run/react';

import { action } from '~/routes/erp+/_admin+/employees+/new';
import { format } from 'date-fns';
import { ILoaderDataPromise } from '~/interfaces/app.interface';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Button } from '~/components/ui/button';
import { ArrowLeft, RotateCcw, Save } from 'lucide-react';
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
import { DatePicker } from '~/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import Defer from '~/components/Defer';
import ErrorCard from '~/components/ErrorCard';

export default function EmployeeDetailForm({
  formId,
  type,
  employeePromise,
  rolesPromise,
}: {
  formId: string;
  type: 'create' | 'update';
  employeePromise?: ILoaderDataPromise<IEmployee>;
  rolesPromise?: ILoaderDataPromise<IRole[]>;
}) {
  const fetcher = useFetcher<typeof action>({ key: formId });
  const toastIdRef = useRef<any>(null);
  const navigate = useNavigate();

  // Form state
  const [code, setCode] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [msisdn, setMsisdn] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [birthDate, setBirthDate] = useState<Date>(new Date());
  const [sex, setSex] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [position, setPosition] = useState<string>('');
  const [joinDate, setJoinDate] = useState<Date>(new Date());
  const [roleId, setRoleId] = useState<string>('');
  const [status, setStatus] = useState<string>('active');

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

    if (!username.trim()) {
      validationErrors.username = 'Vui lòng nhập tên đăng nhập';
    }

    if (type === 'create' && (!password.trim() || password.length < 6)) {
      validationErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
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

    if (!roleId.trim()) {
      validationErrors.roleId = 'Vui lòng chọn vai trò';
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

    // Add all form data
    formData.set('employeeCode', code);
    formData.set('firstName', firstName);
    formData.set('lastName', lastName);
    formData.set('email', email);
    formData.set('username', username);
    if (password.trim()) {
      formData.set('password', password);
    }
    formData.set('msisdn', msisdn);
    formData.set('address', address);
    formData.set('sex', sex);
    formData.set('department', department);
    formData.set('position', position);
    formData.set('role', roleId);
    formData.set('status', status);

    // Format dates for submission
    if (birthDate) {
      formData.set('birthdate', format(birthDate, 'yyyy-MM-dd'));
    }

    if (joinDate) {
      formData.set('joinDate', format(joinDate, 'yyyy-MM-dd'));
    }

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
      username ||
      password ||
      msisdn ||
      address ||
      birthDate ||
      sex ||
      department ||
      position ||
      joinDate ||
      roleId ||
      status;

    setIsChanged(!!hasChanged);
  }, [
    code,
    firstName,
    lastName,
    email,
    username,
    password,
    msisdn,
    address,
    birthDate,
    sex,
    department,
    position,
    joinDate,
    roleId,
    status,
  ]);

  // Handle fetcher response
  useEffect(() => {
    if (fetcher.data?.toast) {
      const { toast: toastData } = fetcher.data;
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
      if ('redirectTo' in fetcher.data && fetcher.data.redirectTo) {
        navigate(fetcher.data.redirectTo, { replace: true });
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
            setUsername(employeeData.emp_user.usr_username || '');
            // Don't set password for security reasons in edit mode
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
            setStatus(employeeData.emp_user.usr_status || 'active');
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
          } else if ('success' in rolesData && !rolesData.success) {
            console.error('Error loading roles:', rolesData.message);
            toast.error('Không thể tải danh sách quyền.');
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

  const sexOptions = [
    { value: 'male', label: 'Nam' },
    { value: 'female', label: 'Nữ' },
    { value: 'other', label: 'Khác' },
  ];

  const statusOptions = [
    { value: 'active', label: 'Hoạt động' },
    { value: 'inactive', label: 'Ngưng hoạt động' },
  ];

  console.log(birthDate);
  return (
    <Defer resolve={rolesPromise} fallback={<LoadingCard />}>
      {(rolesData) => {
        if (!rolesData || ('success' in rolesData && !rolesData.success)) {
          return (
            <ErrorCard
              message={
                rolesData &&
                'message' in rolesData &&
                typeof rolesData.message === 'string'
                  ? rolesData.message
                  : 'Đã xảy ra lỗi khi tải dữ liệu quyền'
              }
            />
          );
        }

        const roleOptions = Array.isArray(rolesData)
          ? rolesData.map((role) => ({
              value: role.id,
              label: role.name,
            }))
          : [];

        return (
          <fetcher.Form
            id={formId}
            method={type === 'create' ? 'POST' : 'PUT'}
            onSubmit={handleSubmit}
          >
            <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200'>
              <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white py-4 sm:py-6 rounded-t-xl'>
                <CardTitle className='text-white text-lg sm:text-2xl lg:text-3xl font-bold text-center sm:text-left'>
                  {code || 'Mã nhân viên'}
                </CardTitle>
              </CardHeader>

              <CardContent className='p-4 sm:p-6 space-y-4 sm:space-y-6'>
                {/* Employee Code */}
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
                  <div>
                    <Label
                      htmlFor='code'
                      className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'
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
                        className={`flex-1 text-sm sm:text-base ${errors.code ? 'border-red-500' : ''}`}
                      />
                      <Button
                        type='button'
                        variant='outline'
                        onClick={generateEmployeeCode}
                        className='px-2 sm:px-3 flex-shrink-0'
                        size='sm'
                      >
                        <RotateCcw className='w-3 h-3 sm:w-4 sm:h-4' />
                        <span className='hidden sm:inline ml-1'>Tạo mã</span>
                      </Button>
                    </div>
                    {errors.code && (
                      <p className='text-red-500 text-xs sm:text-sm mt-1'>
                        {errors.code}
                      </p>
                    )}
                  </div>
                </div>

                {/* Personal Information */}
                <div className='space-y-3 sm:space-y-4'>
                  <h3 className='text-base sm:text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2'>
                    Thông tin cá nhân
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
                        Số điện thoại <span className='text-red-500'>*</span>
                      </Label>
                      <Input
                        id='msisdn'
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
                        initialDate={birthDate}
                        onChange={(date) => setBirthDate(date)}
                        name='birthdate'
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
                        Tên đăng nhập <span className='text-red-500'>*</span>
                      </Label>
                      <Input
                        id='username'
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

                    {type === 'create' && (
                      <div>
                        <Label
                          htmlFor='password'
                          className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'
                        >
                          Mật khẩu <span className='text-red-500'>*</span>
                        </Label>
                        <Input
                          id='password'
                          type='password'
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder='Nhập mật khẩu (tối thiểu 6 ký tự)'
                          className={`text-sm sm:text-base ${errors.password ? 'border-red-500' : ''}`}
                        />
                        {errors.password && (
                          <p className='text-red-500 text-xs sm:text-sm mt-1'>
                            {errors.password}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Work Information */}
                <div className='space-y-3 sm:space-y-4'>
                  <h3 className='text-base sm:text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2'>
                    Thông tin công việc
                  </h3>

                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6'>
                    <div>
                      <Label
                        htmlFor='department'
                        className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'
                      >
                        Phòng ban <span className='text-red-500'>*</span>
                      </Label>
                      <Input
                        id='department'
                        type='text'
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder='Nhập phòng ban'
                        className={`text-sm sm:text-base ${errors.department ? 'border-red-500' : ''}`}
                      />
                      {errors.department && (
                        <p className='text-red-500 text-xs sm:text-sm mt-1'>
                          {errors.department}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label
                        htmlFor='position'
                        className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'
                      >
                        Chức vụ <span className='text-red-500'>*</span>
                      </Label>
                      <Input
                        id='position'
                        type='text'
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        placeholder='Nhập chức vụ'
                        className={`text-sm sm:text-base ${errors.position ? 'border-red-500' : ''}`}
                      />
                      {errors.position && (
                        <p className='text-red-500 text-xs sm:text-sm mt-1'>
                          {errors.position}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label
                        htmlFor='joinDate'
                        className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'
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
                        className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'
                      >
                        Vai trò <span className='text-red-500'>*</span>
                      </Label>
                      <Select value={roleId} onValueChange={setRoleId}>
                        <SelectTrigger
                          className={`text-sm sm:text-base ${errors.roleId ? 'border-red-500' : ''}`}
                        >
                          <SelectValue placeholder='Chọn vai trò' />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.roleId && (
                        <p className='text-red-500 text-xs sm:text-sm mt-1'>
                          {errors.roleId}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label
                        htmlFor='status'
                        className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'
                      >
                        Trạng thái
                      </Label>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className='text-sm sm:text-base'>
                          <SelectValue placeholder='Chọn trạng thái' />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((statusOption) => (
                            <SelectItem
                              key={statusOption.value}
                              value={statusOption.value}
                            >
                              {statusOption.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className='p-4 sm:p-6'>
                <div className='w-full flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3'>
                  <Link
                    to='/erp/employees'
                    className='bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm flex items-center justify-center transition-all duration-300 order-2 sm:order-1'
                  >
                    <ArrowLeft className='w-4 h-4 mr-1' />
                    <span className='hidden sm:inline'>Trở về Danh sách</span>
                    <span className='sm:hidden'>Trở về</span>
                  </Link>

                  <div className='flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 order-1 sm:order-2'>
                    <Button
                      className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow transform hover:-translate-y-0.5 w-full sm:w-auto'
                      type='submit'
                      form={formId}
                      disabled={!isChanged}
                    >
                      <Save />
                      <span className='hidden sm:inline'>
                        {type === 'create'
                          ? 'Tạo Nhân viên'
                          : 'Cập nhật Nhân viên'}
                      </span>
                      <span className='sm:hidden'>
                        {type === 'create' ? 'Tạo' : 'Cập nhật'}
                      </span>
                    </Button>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </fetcher.Form>
        );
      }}
    </Defer>
  );
}
