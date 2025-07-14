import { toast } from 'react-toastify';
import { useEffect, useRef, useState } from 'react';
import { Link, useFetcher, useNavigate } from '@remix-run/react';

import { action } from '~/routes/erp+/_admin+/crm+/customers+/new';
import { format } from 'date-fns';
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
import { DatePicker } from '~/components/ui/date-picker';
import {
  getDistrictBySlug,
  getDistrictsByProvinceCode,
  getProvinceBySlug,
  provinces,
} from '~/utils/address.util';

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
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [sex, setSex] = useState<string>('');
  const [contactChannel, setContactChannel] = useState<string>('');
  const [source, setSource] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [createdAt, setCreatedAt] = useState<Date | null>(null);

  // address state
  const [province, setProvince] = useState(provinces[0]);
  const [districts, setDistricts] = useState(
    getDistrictsByProvinceCode(province.code),
  );
  const [district, setDistrict] = useState(districts[0]);
  const [street, setStreet] = useState('');

  // Control states
  const [customer, setCustomer] = useState<ICustomer | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isChanged, setIsChanged] = useState(false);
  const [isContentReady, setIsContentReady] = useState(type !== 'update');

  // Handle province changes
  useEffect(() => {
    const newDistricts = getDistrictsByProvinceCode(province.code);
    setDistricts(newDistricts);
    setDistrict(newDistricts[0] || districts[0]);
  }, [province]);

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

    if (!contactChannel.trim()) {
      validationErrors.contactChannel = 'Vui lòng chọn kênh liên hệ';
    }

    if (!source.trim()) {
      validationErrors.source = 'Vui lòng chọn nguồn khách hàng';
    }

    if (!province.slug) {
      validationErrors.province = 'Vui lòng chọn tỉnh/thành phố';
    }

    if (!district.slug) {
      validationErrors.district = 'Vui lòng chọn quận/huyện';
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
      province.slug ||
      district.slug ||
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
    province,
    district,
    createdAt,
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

            // Handle address object structure
            if (customerData.cus_address) {
              const address = customerData.cus_address;
              if (typeof address === 'object' && address !== null) {
                // Handle address as object with province, district, street
                const provinceData =
                  getProvinceBySlug(address.province) || provinces[0];
                setProvince(provinceData);

                const districtsData = getDistrictsByProvinceCode(
                  provinceData.code,
                );
                setDistricts(districtsData);

                const districtData =
                  districtsData.find((d) => d.slug === address.district) ||
                  districtsData[0];
                setDistrict(districtData);

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
        <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white py-6 rounded-t-xl'>
          <CardTitle className='text-white text-3xl font-bold'>
            {code || 'Mã khách hàng'}
          </CardTitle>
        </CardHeader>

        <CardContent className='p-6 space-y-6'>
          {/* Customer Code */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
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
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
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
                className='bg-white border-gray-300'
              />
              {errors.firstName && (
                <p className='text-red-500 text-sm mt-1'>{errors.firstName}</p>
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
                htmlFor='customer_email'
                className='text-gray-700 font-semibold mb-2 block'
              >
                Email <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='customer_email'
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
                className='bg-white border-gray-300'
              />
              {errors.msisdn && (
                <p className='text-red-500 text-sm mt-1'>{errors.msisdn}</p>
              )}
            </div>
          </div>

          {/* Personal Information */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
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
                options={[
                  { value: CUSTOMER.SEX.MALE, label: 'Nam' },
                  { value: CUSTOMER.SEX.FEMALE, label: 'Nữ' },
                ]}
                defaultValue={sex}
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
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold text-gray-700'>Địa chỉ</h3>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div>
                <Label
                  htmlFor='customer_province'
                  className='text-gray-700 font-semibold mb-2 block'
                >
                  Tỉnh/Thành phố <span className='text-red-500'>*</span>
                </Label>
                <SelectSearch
                  options={provinces.map((p) => ({
                    value: p.slug,
                    label: p.name,
                  }))}
                  value={province.slug}
                  onValueChange={(value) => {
                    const selectedProvince =
                      getProvinceBySlug(value) || provinces[0];
                    setProvince(selectedProvince);
                    const newDistricts = getDistrictsByProvinceCode(
                      selectedProvince.code,
                    );
                    setDistricts(newDistricts);
                    setDistrict(newDistricts[0]);
                  }}
                  placeholder='Chọn tỉnh/thành phố'
                  name='province'
                  id='customer_province'
                />
              </div>

              <div>
                <Label
                  htmlFor='customer_district'
                  className='text-gray-700 font-semibold mb-2 block'
                >
                  Quận/Huyện <span className='text-red-500'>*</span>
                </Label>
                <SelectSearch
                  options={districts.map((d) => ({
                    value: d.slug,
                    label: d.name,
                  }))}
                  value={district.slug}
                  onValueChange={(value) => {
                    const selectedDistrict =
                      getDistrictBySlug(districts, value) || districts[0];
                    setDistrict(selectedDistrict);
                  }}
                  placeholder='Chọn quận/huyện'
                  name='district'
                  id='customer_district'
                />
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
                  className='bg-white border-gray-300'
                />
              </div>
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
                  name='notes'
                  value={notes}
                  isReady={isContentReady}
                  onChange={setNotes}
                  className='min-h-40'
                  placeholder='Nhập ghi chú về khách hàng...'
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
