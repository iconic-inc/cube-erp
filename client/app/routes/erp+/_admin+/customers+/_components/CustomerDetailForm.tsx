import { toast } from 'react-toastify';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw, Save } from 'lucide-react';
import { Link, useFetcher, useNavigate } from '@remix-run/react';
import { format } from 'date-fns';
import { Province } from 'new-vn-provinces/provinces';
import { Ward } from 'new-vn-provinces/wards';
import { getWardsByProvinceId, getProvinceData } from 'new-vn-provinces/cache';

import { action } from '~/routes/erp+/_admin+/customers+/new';
import { ILoaderDataPromise } from '~/interfaces/app.interface';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Button } from '~/components/ui/button';
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
import TextEditor from '~/components/TextEditor';
import { DatePicker } from '~/components/ui/date-picker';
import { useFetcherResponseHandler } from '~/hooks/useFetcherResponseHandler';

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

  // Form state
  const [code, setCode] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [msisdn, setMsisdn] = useState<string>('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [sex, setSex] = useState<string>(CUSTOMER.SEX.MALE.value);
  const [contactChannel, setContactChannel] = useState<string>('');
  const [source, setSource] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [createdAt, setCreatedAt] = useState<Date>(new Date());

  // address state
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('');
  const [selectedWardId, setSelectedWardId] = useState<string>('');
  const [street, setStreet] = useState<string>('');

  // Control states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isChanged, setIsChanged] = useState(false);
  const [isContentReady, setIsContentReady] = useState(type !== 'update');

  // Handle province changes
  useEffect(() => {
    (async () => {
      const provincesData = await getProvinceData();
      setProvinces(provincesData);

      if (selectedProvinceId) {
        const newWards = await getWardsByProvinceId(selectedProvinceId);
        setWards(newWards);
      }
    })();
  }, [selectedProvinceId]);

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

    if (email.trim() && !/\S+@\S+\.\S+/.test(email)) {
      validationErrors.email = 'Email không hợp lệ';
    }

    if (!msisdn.trim()) {
      validationErrors.msisdn = 'Vui lòng nhập số điện thoại';
    }

    if (!contactChannel.trim()) {
      validationErrors.contactChannel = 'Vui lòng chọn kênh liên hệ';
    }

    if (!source.trim()) {
      validationErrors.source = 'Vui lòng chọn nguồn khách hàng';
    }

    if (!selectedProvinceId) {
      validationErrors.provinceId = 'Vui lòng chọn tỉnh/thành phố';
    }

    if (!selectedWardId) {
      validationErrors.wardId = 'Vui lòng chọn phường/xã';
    }

    if (!street.trim()) {
      validationErrors.street = 'Vui lòng nhập địa chỉ chi tiết';
    }

    if (!createdAt) {
      validationErrors.createdAt = 'Vui lòng chọn ngày tạo';
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

    // Manually append birthDate if it exists
    if (birthDate) {
      formData.set('birthDate', format(birthDate, 'yyyy-MM-dd'));
    } else {
      formData.set('birthDate', '');
    }

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
      selectedProvinceId ||
      selectedWardId ||
      street ||
      birthDate ||
      createdAt ||
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
    street,
    selectedProvinceId,
    selectedWardId,
    createdAt,
    birthDate,
    sex,
    contactChannel,
    source,
    notes,
  ]);

  // Handle fetcher response
  useFetcherResponseHandler(fetcher);

  // Load customer data when in edit mode
  useEffect(() => {
    if (type === 'update' && customerPromise) {
      const loadCustomer = async () => {
        try {
          const customerData = await customerPromise;

          if (customerData && 'cus_code' in customerData) {
            setCode(customerData.cus_code || '');
            setFirstName(customerData.cus_firstName || '');
            setLastName(customerData.cus_lastName || '');
            setEmail(customerData.cus_email || '');
            setMsisdn(customerData.cus_msisdn || '');

            // Handle address object structure
            if (customerData.cus_address) {
              const address = customerData.cus_address;
              if (typeof address === 'object' && address !== null) {
                // Handle address as object with provinceId, wardId, street
                setSelectedProvinceId(address.provinceId || '');
                setSelectedWardId(address.wardId || '');
                setStreet(address.street || '');
              } else if (typeof address === 'string') {
                // Handle address as string (fallback)
                setStreet(address);
              }
            }

            setBirthDate(
              customerData.cus_birthDate
                ? new Date(customerData.cus_birthDate)
                : null,
            );
            setCreatedAt(
              customerData.cus_createdAt
                ? new Date(customerData.cus_createdAt)
                : new Date(),
            );
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
      onSubmit={handleSubmit}
    >
      <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200'>
        <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white py-4 sm:py-6 rounded-t-xl'>
          <CardTitle className='text-white text-xl sm:text-2xl lg:text-3xl font-bold text-center sm:text-left'>
            {code || 'Mã khách hàng'}
          </CardTitle>
        </CardHeader>

        <CardContent className='p-4 sm:p-6 space-y-4 sm:space-y-6'>
          {/* Customer Code */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
            <div>
              <Label
                htmlFor='customer_code'
                className='text-gray-700 font-semibold mb-2 block'
              >
                Mã khách hàng <span className='text-red-500'>*</span>
              </Label>
              <div className='flex gap-2'>
                <Input
                  id='customer_code'
                  name='code'
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder='Ví dụ: KH123456'
                  className='bg-white border-gray-300 text-sm sm:text-base'
                />
              </div>
              {errors.code && (
                <p className='text-red-500 text-sm mt-1'>{errors.code}</p>
              )}
            </div>

            <div>
              <Label
                htmlFor='customer_birthDate'
                className='text-gray-700 font-semibold mb-2 block'
              >
                Ngày tạo <span className='text-red-500'>*</span>
              </Label>
              <DatePicker
                id='customer_createdAt'
                name='createdAt'
                initialDate={createdAt}
                onChange={(date) => setCreatedAt(date)}
              />
            </div>
          </div>

          {/* Name Fields */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
            <div>
              <Label
                htmlFor='customer_firstName'
                className='text-gray-700 font-semibold mb-2 block'
              >
                Tên <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='customer_firstName'
                name='firstName'
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder='Nhập tên khách hàng'
                className='bg-white border-gray-300 text-sm sm:text-base'
              />
              {errors.firstName && (
                <p className='text-red-500 text-sm sm:text-base mt-1'>
                  {errors.firstName}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor='customer_lastName'
                className='text-gray-700 font-semibold mb-2 block'
              >
                Họ <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='customer_lastName'
                name='lastName'
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder='Nhập họ khách hàng'
                className='bg-white border-gray-300 text-sm sm:text-base'
              />
              {errors.lastName && (
                <p className='text-red-500 text-sm sm:text-base mt-1'>
                  {errors.lastName}
                </p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
            <div>
              <Label
                htmlFor='customer_email'
                className='text-gray-700 font-semibold mb-2 block'
              >
                Email
              </Label>
              <Input
                id='customer_email'
                name='email'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='Nhập email khách hàng'
                className='bg-white border-gray-300 text-sm sm:text-base'
              />
              {errors.email && (
                <p className='text-red-500 text-sm sm:text-base mt-1'>
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor='customer_msisdn'
                className='text-gray-700 font-semibold mb-2 block'
              >
                Số điện thoại <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='customer_msisdn'
                name='msisdn'
                value={msisdn}
                onChange={(e) => setMsisdn(e.target.value)}
                placeholder='Nhập số điện thoại khách hàng'
                className='bg-white border-gray-300 text-sm sm:text-base'
              />
              {errors.msisdn && (
                <p className='text-red-500 text-sm sm:text-base mt-1'>
                  {errors.msisdn}
                </p>
              )}
            </div>
          </div>

          {/* Personal Information */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6'>
            <div>
              <Label
                htmlFor='customer_birthDate'
                className='text-gray-700 font-semibold mb-2 block'
              >
                Ngày sinh
              </Label>
              <DatePicker
                id='customer_birthDate'
                name='birthDate'
                initialDate={birthDate}
                onChange={(date) => setBirthDate(date)}
              />
            </div>

            <div>
              <Label
                htmlFor='customer_sex'
                className='text-gray-700 font-semibold mb-2 block'
              >
                Giới tính
              </Label>
              <SelectSearch
                options={Object.values(CUSTOMER.SEX)}
                value={sex}
                onValueChange={(value) => setSex(value)}
                placeholder='Chọn giới tính'
                name='sex'
                id='customer_sex'
              />
            </div>

            <div>
              <Label
                htmlFor='customer_contactChannel'
                className='text-gray-700 font-semibold mb-2 block'
              >
                Kênh liên hệ <span className='text-red-500'>*</span>
              </Label>
              <SelectSearch
                id='customer_contactChannel'
                name='contactChannel'
                options={Object.values(CUSTOMER.CONTACT_CHANNEL)}
                value={contactChannel}
                onValueChange={(value) => setContactChannel(value)}
                placeholder='Nhập kênh liên hệ'
              />
            </div>

            <div>
              <Label
                htmlFor='customer_source'
                className='text-gray-700 font-semibold mb-2 block'
              >
                Nguồn khách hàng <span className='text-red-500'>*</span>
              </Label>

              <SelectSearch
                id='customer_source'
                name='source'
                placeholder='Nhập nguồn khách hàng'
                value={source}
                onValueChange={(value) => setSource(value)}
                options={Object.values(CUSTOMER.SOURCE)}
              />
            </div>
          </div>

          {/* Address Fields */}
          <div className='space-y-3 sm:space-y-4'>
            <h3 className='text-base sm:text-lg font-semibold text-gray-700'>
              Địa chỉ
            </h3>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'>
              <div>
                <Label
                  htmlFor='customer_province'
                  className='text-gray-700 font-semibold mb-2 block'
                >
                  Tỉnh/Thành phố <span className='text-red-500'>*</span>
                </Label>
                <SelectSearch
                  options={provinces.map((p) => ({
                    value: p.idProvince,
                    label: p.name,
                  }))}
                  value={selectedProvinceId}
                  onValueChange={async (value) => {
                    setSelectedProvinceId(value);
                    setSelectedWardId(''); // Reset ward when province changes
                    const newWards = await getWardsByProvinceId(value);
                    setWards(newWards);
                  }}
                  placeholder='Chọn tỉnh/thành phố'
                  name='provinceId'
                  id='customer_province'
                />
                {errors.provinceId && (
                  <p className='text-red-500 text-sm sm:text-base mt-1'>
                    {errors.provinceId}
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor='customer_ward'
                  className='text-gray-700 font-semibold mb-2 block'
                >
                  Phường/Xã <span className='text-red-500'>*</span>
                </Label>
                <SelectSearch
                  options={wards.map((w) => ({
                    value: w.idWard,
                    label: w.name,
                  }))}
                  value={selectedWardId}
                  onValueChange={(value) => {
                    setSelectedWardId(value);
                  }}
                  placeholder='Chọn phường/xã'
                  name='wardId'
                  id='customer_ward'
                />
                {errors.wardId && (
                  <p className='text-red-500 text-sm sm:text-base mt-1'>
                    {errors.wardId}
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor='customer_street'
                  className='text-gray-700 font-semibold mb-2 block'
                >
                  Địa chỉ chi tiết <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='customer_street'
                  name='street'
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder='Nhập địa chỉ chi tiết'
                  className='bg-white border-gray-300 text-sm sm:text-base'
                />
                {errors.street && (
                  <p className='text-red-500 text-sm sm:text-base mt-1'>
                    {errors.street}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'>
              Ghi chú
            </Label>

            <TextEditor
              name='notes'
              value={notes}
              isReady={isContentReady}
              onChange={setNotes}
              className='min-h-48 sm:min-h-40'
              placeholder='Nhập ghi chú về khách hàng...'
            />
          </div>
        </CardContent>

        <CardFooter className='p-4 sm:p-6'>
          <div className='w-full flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0'>
            <Link
              prefetch='intent'
              to='/erp/customers'
              className='bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base flex items-center transition-all duration-300 w-full sm:w-auto justify-center sm:justify-start'
            >
              <ArrowLeft className='h-4 w-4' />
              <span className='hidden sm:inline'>Trở về Danh sách</span>
              <span className='sm:hidden'>Trở về</span>
            </Link>

            <div className='flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto'>
              <Button
                className='bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base flex items-center transition-all duration-300 shadow-sm hover:shadow transform hover:-translate-y-0.5 w-full sm:w-auto justify-center'
                type='submit'
                form={formId}
                disabled={!isChanged}
              >
                <Save className='h-4 w-4' />
                <span className='hidden sm:inline'>
                  {type === 'create' ? 'Tạo khách hàng' : 'Cập nhật khách hàng'}
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
}
