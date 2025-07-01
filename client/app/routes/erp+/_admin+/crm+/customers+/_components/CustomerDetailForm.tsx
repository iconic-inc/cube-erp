import { toast } from 'react-toastify';
import { useEffect, useRef, useState } from 'react';
import { Link, useFetcher, useNavigate } from '@remix-run/react';

import { action } from '~/routes/erp+/_admin+/crm+/customers+/new';
import { ILoaderDataPromise } from '~/interfaces/app.interface';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Button } from '~/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { ICustomer } from '~/interfaces/customer.interface';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import LoadingCard from '~/components/LoadingCard';
import { SelectSearch } from '~/components/ui/SelectSearch';
import { CUSTOMER } from '~/constants/customer.constant';
import TextEditor from '~/components/TextEditor/index.client';
import Hydrated from '~/components/Hydrated';

export default function CustomerDetailForm({
  formId,
  type,
  customerPromise,
  action: actionPath,
}: {
  formId: string;
  type: 'create' | 'update';
  customerPromise?: ILoaderDataPromise<ICustomer>;
  action?: string;
}) {
  const fetcher = useFetcher<typeof action>({ key: formId });
  const toastIdRef = useRef<any>(null);
  const navigate = useNavigate();

  // Form state
  const [code, setCode] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [msisdn, setMsisdn] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [birthDate, setBirthDate] = useState<string>('');
  const [sex, setSex] = useState<string>('');
  const [contactChannel, setContactChannel] = useState<string>('');
  const [source, setSource] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Control states
  const [customer, setCustomer] = useState<ICustomer | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isChanged, setIsChanged] = useState(false);
  const [isContentReady, setIsContentReady] = useState(type !== 'update');

  // Generate customer code
  const generateCustomerCode = () => {
    const timestamp = Date.now().toString().slice(-6);
    const codeGenerated = `KH${timestamp}`;
    setCode(codeGenerated);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation
    const validationErrors: Record<string, string> = {};

    if (!code.trim()) {
      validationErrors.code = 'Vui lòng nhập mã khách hàng';
    }

    if (!firstName.trim()) {
      validationErrors.firstName = 'Vui lòng nhập tên khách hàng';
    }

    if (!lastName.trim()) {
      validationErrors.lastName = 'Vui lòng nhập họ khách hàng';
    }

    if (!email.trim()) {
      validationErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      validationErrors.email = 'Email không hợp lệ';
    }

    if (!msisdn.trim()) {
      validationErrors.msisdn = 'Vui lòng nhập số điện thoại';
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

    formData.append('code', code);
    formData.append('firstName', firstName);
    formData.append('lastName', lastName);
    formData.append('email', email);
    formData.append('msisdn', msisdn);
    formData.append('address', address);
    formData.append('birthDate', birthDate);
    formData.append('sex', sex);
    formData.append('contactChannel', contactChannel);
    formData.append('source', source);
    formData.append('notes', notes);

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
      contactChannel ||
      source ||
      notes;

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
    contactChannel,
    source,
    notes,
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
      if (fetcher.data?.redirectTo) {
        navigate(fetcher.data.redirectTo, { replace: true });
      }
    }
  }, [fetcher.data, navigate]);

  // Load customer data when in edit mode
  useEffect(() => {
    if (type === 'update' && customerPromise) {
      const loadCustomer = async () => {
        try {
          const customerData = await customerPromise;

          if (customerData && 'cus_code' in customerData) {
            setCustomer(customerData);
            setCode(customerData.cus_code || '');
            setFirstName(customerData.cus_firstName || '');
            setLastName(customerData.cus_lastName || '');
            setEmail(customerData.cus_email || '');
            setMsisdn(customerData.cus_msisdn || '');
            setAddress(customerData.cus_address || '');
            setBirthDate(customerData.cus_birthDate || '');
            setSex(customerData.cus_sex || '');
            setContactChannel(customerData.cus_contactChannel || '');
            setSource(customerData.cus_source || '');
            setNotes(customerData.cus_notes || '');
          } else {
            console.error(
              'Customer data is not in the expected format:',
              customerData,
            );
            toast.error(
              'Không thể tải dữ liệu khách hàng. Vui lòng thử lại sau.',
            );
          }
        } catch (error) {
          console.error('Error loading customer data:', error);
          toast.error(
            'Không thể tải dữ liệu khách hàng. Vui lòng thử lại sau.',
          );
        }
      };

      loadCustomer().then(() => {
        setIsContentReady(true);
      });
    }
  }, [type, customerPromise]);

  if (!isContentReady) {
    return <LoadingCard />;
  }

  return (
    <fetcher.Form
      id={formId}
      method={type === 'create' ? 'POST' : 'PUT'}
      action={actionPath}
      onSubmit={handleSubmit}
    >
      <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200'>
        <CardHeader className='bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-6 rounded-t-xl'>
          <CardTitle className='text-white text-3xl font-bold'>
            {code || 'Mã khách hàng'}
          </CardTitle>
        </CardHeader>

        <CardContent className='p-6 space-y-6'>
          {/* Customer Code */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <Label
                htmlFor='code'
                className='text-gray-700 font-semibold mb-2 block'
              >
                Mã khách hàng <span className='text-red-500'>*</span>
              </Label>
              <div className='flex gap-2'>
                <Input
                  id='code'
                  name='code'
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder='Ví dụ: KH123456'
                  className='bg-white border-gray-300'
                />
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={generateCustomerCode}
                  className='whitespace-nowrap'
                >
                  <RotateCcw className='h-4 w-4 mr-1' />
                  Tự động tạo
                </Button>
              </div>
              {errors.code && (
                <p className='text-red-500 text-sm mt-1'>{errors.code}</p>
              )}
            </div>
          </div>

          {/* Name Fields */}
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
                placeholder='Nhập tên khách hàng'
                className='bg-white border-gray-300'
              />
              {errors.firstName && (
                <p className='text-red-500 text-sm mt-1'>{errors.firstName}</p>
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
                placeholder='Nhập họ khách hàng'
                className='bg-white border-gray-300'
              />
              {errors.lastName && (
                <p className='text-red-500 text-sm mt-1'>{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
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
                placeholder='Nhập email khách hàng'
                className='bg-white border-gray-300'
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
                value={msisdn}
                onChange={(e) => setMsisdn(e.target.value)}
                placeholder='Nhập số điện thoại khách hàng'
                className='bg-white border-gray-300'
              />
              {errors.msisdn && (
                <p className='text-red-500 text-sm mt-1'>{errors.msisdn}</p>
              )}
            </div>
          </div>

          {/* Personal Information */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div>
              <Label
                htmlFor='birthDate'
                className='text-gray-700 font-semibold mb-2 block'
              >
                Ngày sinh
              </Label>
              <Input
                id='birthDate'
                name='birthDate'
                type='date'
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className='bg-white border-gray-300'
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
                options={[
                  { value: CUSTOMER.SEX.MALE, label: 'Nam' },
                  { value: CUSTOMER.SEX.FEMALE, label: 'Nữ' },
                ]}
                defaultValue={sex}
                onValueChange={(value) => setSex(value)}
                placeholder='Chọn giới tính'
                name='sex'
                id='sex'
              />
            </div>

            <div>
              <Label
                htmlFor='contactChannel'
                className='text-gray-700 font-semibold mb-2 block'
              >
                Kênh liên hệ
              </Label>
              <Input
                id='contactChannel'
                name='contactChannel'
                value={contactChannel}
                onChange={(e) => setContactChannel(e.target.value)}
                placeholder='Nhập kênh liên hệ'
                className='bg-white border-gray-300'
              />
            </div>
          </div>

          {/* Address and Source */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
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
                placeholder='Nhập địa chỉ khách hàng'
                className='bg-white border-gray-300'
              />
            </div>

            <div>
              <Label
                htmlFor='source'
                className='text-gray-700 font-semibold mb-2 block'
              >
                Nguồn khách hàng
              </Label>
              <Input
                id='source'
                name='source'
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder='Nhập nguồn khách hàng'
                className='bg-white border-gray-300'
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className='text-gray-700 font-semibold mb-2 block'>
              Ghi chú
            </Label>

            <Hydrated>
              {() => (
                <TextEditor
                  isReady={isContentReady}
                  name='notes'
                  value={notes}
                  onChange={setNotes}
                  placeholder='Nhập ghi chú về khách hàng...'
                  className='min-h-[200px]'
                />
              )}
            </Hydrated>
          </div>
        </CardContent>

        <CardFooter>
          <div className='w-full flex justify-between items-center'>
            <Link
              to='/erp/crm/customers'
              className='bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm flex items-center transition-all duration-300'
            >
              <span className='material-symbols-outlined text-sm mr-1'>
                keyboard_return
              </span>
              Trở về Danh sách
            </Link>

            <div className='flex space-x-2'>
              <Button
                className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm flex items-center transition-all duration-300 shadow-sm hover:shadow transform hover:-translate-y-0.5'
                type='submit'
                form={formId}
                disabled={!isChanged}
              >
                <span className='material-symbols-outlined text-sm mr-1'>
                  save
                </span>
                {type === 'create' ? 'Tạo khách hàng' : 'Cập nhật khách hàng'}
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </fetcher.Form>
  );
}
