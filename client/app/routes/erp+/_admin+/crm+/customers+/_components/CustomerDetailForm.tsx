import { toast } from 'react-toastify';
import { useEffect, useRef, useState } from 'react';
import { useFetcher, useNavigate } from '@remix-run/react';

import { action } from '~/routes/erp+/_admin+/crm+/customers+/new';
import TextInput from '~/components/TextInput';
import { ICustomer } from '~/interfaces/customer.interface';
import { format } from 'date-fns';
import { Card, CardContent } from '~/components/ui/card';
import Select from '~/widgets/Select';
import { CUSTOMER } from '~/constants/customer.constant';
import TextEditor from '~/components/TextEditor/index.client';
import Hydrated from '~/components/Hydrated';

export default function CustomerDetailForm({
  formId,
  customer,
  setIsChanged,
  type,
}: {
  formId: string;
  customer?: ICustomer;
  setIsChanged: (value: boolean) => void;
  type: 'create' | 'update';
}) {
  const fetcher = useFetcher<typeof action>({ key: formId });
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState(customer?.cus_firstName || '');
  const [lastName, setLastName] = useState(customer?.cus_lastName || '');
  const [email, setEmail] = useState(customer?.cus_email || '');
  const [msisdn, setMsisdn] = useState(customer?.cus_msisdn || '');
  const [address, setAddress] = useState(customer?.cus_address || '');
  const [sex, setSex] = useState(customer?.cus_sex || '');
  const [birhtdate, setBirthdate] = useState(
    format(new Date(customer?.cus_birthDate || Date.now()), 'yyyy-MM-dd'),
  );
  const [customerCode, setCustomerCode] = useState(customer?.cus_code || '');
  const [contactChannel, setContactChannel] = useState(
    customer?.cus_contactChannel || '',
  );
  const [source, setSource] = useState(customer?.cus_source || '');
  const [notes, setNotes] = useState(customer?.cus_notes || '');

  // Thêm state để theo dõi lỗi
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setIsChanged(
      firstName !== customer?.cus_firstName ||
        lastName !== customer?.cus_lastName ||
        email !== customer?.cus_email ||
        msisdn !== customer?.cus_msisdn ||
        address !== customer?.cus_address ||
        birhtdate !== customer?.cus_birthDate ||
        customerCode !== customer?.cus_code ||
        sex !== customer.cus_sex ||
        contactChannel !== customer?.cus_contactChannel ||
        source !== customer?.cus_source ||
        notes !== customer?.cus_notes,
    );
  }, [
    firstName,
    lastName,
    email,
    msisdn,
    address,
    birhtdate,
    customerCode,
    sex,
    contactChannel,
    source,
    notes,
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

          if (fetcher.data?.redirectTo) {
            navigate(fetcher.data.redirectTo, {
              replace: true,
            });
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
            if (!customerCode)
              newErrors.customerCode = 'Mã nhân viên là bắt buộc';
            if (!firstName) newErrors.firstName = 'Tên là bắt buộc';
            if (!lastName) newErrors.lastName = 'Họ là bắt buộc';
            if (!email) newErrors.email = 'Email là bắt buộc';
            newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';

            setErrors(newErrors);
          }
        }
        break;
    }
  }, [fetcher.state, fetcher.data]);

  return (
    <Card className='w-full'>
      <CardContent className='p-6'>
        <fetcher.Form
          id={formId}
          method={type === 'create' ? 'POST' : 'PUT'}
          className='grid grid-cols-1 lg:grid-cols-3 gap-6'
        >
          <TextInput
            label={
              <span>
                Mã Khách hàng <span className='text-red-500'>*</span>
              </span>
            }
            name='code'
            value={customerCode}
            onChange={(value) => setCustomerCode(value)}
            required
            error={errors.customerCode}
            placeholder='Nhập mã khách hàng'
          />

          <TextInput
            label='Họ'
            name='lastName'
            value={lastName}
            onChange={(value) => setLastName(value)}
            required
            error={errors.lastName}
            placeholder='Nhập họ Khách hàng'
          />

          <TextInput
            label={
              <span>
                Tên <span className='text-red-500'>*</span>
              </span>
            }
            name='firstName'
            value={firstName}
            onChange={(value) => setFirstName(value)}
            required
            error={errors.firstName}
            placeholder='Nhập tên Khách hàng'
          />

          <TextInput
            label={
              <span>
                Email <span className='text-red-500'>*</span>
              </span>
            }
            name='email'
            type='email'
            value={email}
            onChange={(value) => setEmail(value)}
            required
            error={errors.email}
            placeholder='Nhập email Khách hàng'
          />
          <TextInput
            label={
              <span>
                Số điện thoại <span className='text-red-500'>*</span>
              </span>
            }
            name='msisdn'
            value={msisdn}
            onChange={(value) => setMsisdn(value)}
            required
            error={errors.msisdn}
            placeholder='Nhập số điện thoại Khách hàng'
          />

          <Select
            label='Giới tính'
            className='w-full'
            name='sex'
            value={sex}
            onChange={(e) => setSex(e.target.value)}
          >
            <option value=''>Chọn giới tính</option>
            <option value={CUSTOMER.SEX.MALE}>Nam</option>
            <option value={CUSTOMER.SEX.FEMALE}>Nữ</option>
          </Select>

          <div className='col-span-2'>
            <TextInput
              label='Địa chỉ'
              name='address'
              value={address}
              onChange={(value) => setAddress(value)}
              placeholder='Nhập địa chỉ Khách hàng'
            />
          </div>

          <TextInput
            label='Ngày sinh'
            name='birthDate'
            type='date'
            value={birhtdate}
            onChange={(value) => setBirthdate(value)}
            placeholder='Nhập ngày sinh Khách hàng'
          />

          <TextInput
            label='Kênh liên hệ'
            name='contactChannel'
            value={contactChannel}
            onChange={(value) => setContactChannel(value)}
            placeholder='Nhập kênh liên hệ Khách hàng'
          />

          <TextInput
            label='Nguồn khách hàng'
            name='source'
            value={source}
            onChange={(value) => setSource(value)}
            placeholder='Nhập nguồn khách hàng'
          />

          <div className='col-span-3'>
            <div className={`w-full items-center gap-4`}>
              <label
                htmlFor='notes'
                className='block text-sm font-semibold leading-6 text-gray-700'
              >
                Ghi chú
              </label>
              <div className='mt-1 flex-grow h-[300px]'>
                <Hydrated>
                  {() => (
                    <TextEditor
                      value={notes}
                      name='notes'
                      onChange={(value) => setNotes(value)}
                    />
                  )}
                </Hydrated>
              </div>
            </div>
          </div>
        </fetcher.Form>
      </CardContent>
    </Card>
  );
}
