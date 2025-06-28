import { toast } from 'react-toastify';
import { useEffect, useRef, useState } from 'react';
import { Link, useFetcher, useNavigate } from '@remix-run/react';

import { action } from '~/routes/erp+/_admin+/transactions+/new';
import { ILoaderDataPromise } from '~/interfaces/app.interface';
import { IListResponse } from '~/interfaces/response.interface';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Button } from '~/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { ICustomer } from '~/interfaces/customer.interface';
import { ICaseService } from '~/interfaces/case.interface';
import { ITransaction } from '~/interfaces/transaction.interface';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import LoadingCard from '~/components/LoadingCard';
import { NumericFormat } from 'react-number-format';
import { SelectSearch } from '~/components/ui/SelectSearch';
import { TRANSACTION } from '~/constants/transaction.constant';
import TextEditor from '~/components/TextEditor/index.client';
import Hydrated from '~/components/Hydrated';

export default function TransactionDetailForm({
  formId,
  customers,
  caseServices,
  type,
  transactionPromise,
  initialCustomerId,
  initialCaseId,
}: {
  formId: string;
  customers: ILoaderDataPromise<IListResponse<ICustomer>>;
  caseServices: ILoaderDataPromise<IListResponse<ICaseService>>;
  type: 'create' | 'update';
  transactionPromise?: ILoaderDataPromise<ITransaction>;
  initialCustomerId?: string | null;
  initialCaseId?: string | null;
}) {
  const fetcher = useFetcher<typeof action>({ key: formId });
  const toastIdRef = useRef<any>(null);
  const navigate = useNavigate();

  // Form state
  const [code, setCode] = useState<string>('');
  const [transactionType, setTransactionType] = useState<'income' | 'outcome'>(
    'income',
  );
  const [title, setTitle] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paid, setPaid] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>(
    initialCustomerId || '',
  );
  const [selectedCaseService, setSelectedCaseService] = useState<string>(
    initialCaseId || '',
  );

  // Control states
  const [customersList, setCustomersList] = useState<ICustomer[]>([]);
  const [caseServicesList, setCaseServicesList] = useState<ICaseService[]>([]);
  const [transaction, setTransaction] = useState<ITransaction | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isChanged, setIsChanged] = useState(false);
  const [isContentReady, setIsContentReady] = useState(type !== 'update');

  // Calculate remaining balance
  const calculateBalance = (): number => {
    const totalAmount = parseFloat(amount) || 0;
    const paidAmount = parseFloat(paid) || 0;
    return Math.max(0, totalAmount - paidAmount);
  };

  // Ensure numeric values for form submission
  const getNumericValue = (value: string): string => {
    return value.toString() || '0';
  };

  // Generate transaction code
  const generateTransactionCode = () => {
    const prefix =
      transactionType === 'income'
        ? 'TN'
        : transactionType === 'outcome'
          ? 'TC'
          : 'TD';
    const timestamp = Date.now().toString().slice(-6);
    const codeGenerated = `${prefix}${timestamp}`;
    setCode(codeGenerated);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation
    const validationErrors: Record<string, string> = {};

    if (!code.trim()) {
      validationErrors.code = 'Vui lòng nhập mã giao dịch';
    }

    if (!title.trim()) {
      validationErrors.title = 'Vui lòng nhập tiêu đề giao dịch';
    }

    if (!amount.trim() || parseFloat(amount) <= 0) {
      validationErrors.amount = 'Vui lòng nhập số tiền hợp lệ';
    }

    if (!paymentMethod) {
      validationErrors.paymentMethod = 'Vui lòng chọn phương thức thanh toán';
    }

    if (!category) {
      validationErrors.category = 'Vui lòng chọn danh mục';
    }

    // If there are validation errors, show them and prevent form submission
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Only show errors below the input fields, not as toast
      return;
    }

    // Clear errors
    setErrors({});

    // Create FormData
    const formData = new FormData(e.currentTarget);

    // Use the raw numeric values for submission
    formData.set('code', code);
    formData.set('type', transactionType);
    formData.set('title', title);
    formData.set('amount', getNumericValue(amount)); // Ensure numeric value
    formData.set('paid', getNumericValue(paid)); // Ensure numeric value
    formData.set('paymentMethod', paymentMethod);
    formData.set('category', category);
    formData.set('description', description);
    formData.set('customer', selectedCustomer);
    formData.set('caseService', selectedCaseService);

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
      title ||
      amount ||
      paid ||
      paymentMethod ||
      category ||
      description ||
      selectedCustomer ||
      selectedCaseService;

    setIsChanged(!!hasChanged);
  }, [
    code,
    title,
    amount,
    paid,
    paymentMethod,
    category,
    description,
    selectedCustomer,
    selectedCaseService,
    transactionType,
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

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load customers
        const customersData = await customers;
        if (customersData && 'data' in customersData && customersData.data) {
          setCustomersList(customersData.data);
        }

        // Load case services
        const caseServicesData = await caseServices;
        if (
          caseServicesData &&
          'data' in caseServicesData &&
          caseServicesData.data
        ) {
          setCaseServicesList(caseServicesData.data);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Có lỗi xảy ra khi tải dữ liệu');
      }
    };

    loadData();
  }, [customers, caseServices]);

  // Load transaction data when in edit mode
  useEffect(() => {
    if (type === 'update' && transactionPromise) {
      const loadTransaction = async () => {
        try {
          const transactionData = await transactionPromise;

          if (transactionData && 'tx_code' in transactionData) {
            setTransaction(transactionData);
            setCode(transactionData.tx_code || '');
            setTransactionType(transactionData.tx_type || 'income');
            setTitle(transactionData.tx_title || '');
            setAmount(transactionData.tx_amount?.toString() || '');
            setPaid(transactionData.tx_paid?.toString() || '');
            setPaymentMethod(transactionData.tx_paymentMethod || '');
            setCategory(transactionData.tx_category || '');
            setDescription(transactionData.tx_description || '');
            setSelectedCustomer(transactionData.tx_customer?.id || '');
            setSelectedCaseService(transactionData.tx_caseService?.id || '');
          } else {
            console.error(
              'Transaction data is not in the expected format:',
              transactionData,
            );
            toast.error(
              'Không thể tải dữ liệu giao dịch. Vui lòng thử lại sau.',
            );
          }
        } catch (error) {
          console.error('Error loading transaction data:', error);
          toast.error('Không thể tải dữ liệu giao dịch. Vui lòng thử lại sau.');
        }
      };

      loadTransaction().then(() => {
        setIsContentReady(true);
      });
    }
  }, [type, transactionPromise]);

  // Reset category when transaction type changes
  useEffect(() => {
    setCategory('');
    generateTransactionCode();
  }, [transactionType]);

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
        <CardHeader className='bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-6 rounded-t-xl'>
          <CardTitle className='text-white text-3xl font-bold'>
            {code || 'Mã giao dịch'}
          </CardTitle>
        </CardHeader>

        <CardContent className='p-6 space-y-6'>
          {/* Transaction Code */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <Label
                htmlFor='code'
                className='text-gray-700 font-semibold mb-2 block'
              >
                Mã giao dịch <span className='text-red-500'>*</span>
              </Label>
              <div className='flex gap-2'>
                <Input
                  id='code'
                  name='code'
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder='Ví dụ: TN123456'
                  className='bg-white border-gray-300'
                />
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={generateTransactionCode}
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

          {/* Title */}
          <div>
            <Label
              htmlFor='title'
              className='text-gray-700 font-semibold mb-2 block'
            >
              Tiêu đề giao dịch <span className='text-red-500'>*</span>
            </Label>
            <Input
              id='title'
              name='title'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='Nhập tiêu đề giao dịch'
              className='bg-white border-gray-300'
            />
            {errors.title && (
              <p className='text-red-500 text-sm mt-1'>{errors.title}</p>
            )}
          </div>

          {/* Transaction Type and Category */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div>
              <Label
                htmlFor='type'
                className='text-gray-700 font-semibold mb-2 block'
              >
                Loại giao dịch <span className='text-red-500'>*</span>
              </Label>
              <SelectSearch
                options={[
                  { value: 'income', label: 'Thu' },
                  { value: 'outcome', label: 'Chi' },
                ]}
                defaultValue={transactionType}
                onValueChange={(value) =>
                  setTransactionType(value as 'income' | 'outcome')
                }
                placeholder='Chọn loại giao dịch'
                name='type'
                id='type'
              />
            </div>

            <div>
              <Label
                htmlFor='category'
                className='text-gray-700 font-semibold mb-2 block'
              >
                Danh mục <span className='text-red-500'>*</span>
              </Label>
              <SelectSearch
                options={Object.values(TRANSACTION.CATEGORY[transactionType])}
                defaultValue={category}
                onValueChange={(value) => setCategory(value)}
                placeholder='Chọn danh mục'
                name='category'
                id='category'
              />
              {errors.category && (
                <p className='text-red-500 text-sm mt-1'>{errors.category}</p>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <Label
                htmlFor='paymentMethod'
                className='text-gray-700 font-semibold mb-2 block'
              >
                Phương thức thanh toán <span className='text-red-500'>*</span>
              </Label>
              <SelectSearch
                options={Object.values(TRANSACTION.PAYMENT_METHOD)}
                defaultValue={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value)}
                placeholder='Chọn phương thức thanh toán'
                name='paymentMethod'
                id='paymentMethod'
              />
              {errors.paymentMethod && (
                <p className='text-red-500 text-sm mt-1'>
                  {errors.paymentMethod}
                </p>
              )}
            </div>
          </div>

          {/* Amount and Paid */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <Label
                htmlFor='amount'
                className='text-gray-700 font-semibold mb-2 block'
              >
                Số tiền <span className='text-red-500'>*</span>
              </Label>
              <div className='relative'>
                <span className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm z-10'>
                  ₫
                </span>
                <NumericFormat
                  id='amount'
                  name='amount'
                  value={amount}
                  onValueChange={(values) => {
                    setAmount(values.value);
                  }}
                  placeholder='0'
                  thousandSeparator=','
                  decimalSeparator='.'
                  decimalScale={2}
                  allowNegative={false}
                  allowLeadingZeros={false}
                  customInput={Input}
                  className='bg-white border-gray-300 pl-8 pr-12 text-right font-medium'
                />
                <span className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm'>
                  VNĐ
                </span>
              </div>
              {errors.amount && (
                <p className='text-red-500 text-sm mt-1'>{errors.amount}</p>
              )}
            </div>

            <div>
              <Label
                htmlFor='paid'
                className='text-gray-700 font-semibold mb-2 block'
              >
                Đã thanh toán
              </Label>
              <div className='relative'>
                <span className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm z-10'>
                  ₫
                </span>
                <NumericFormat
                  id='paid'
                  name='paid'
                  value={paid}
                  onValueChange={(values) => {
                    setPaid(values.value);
                  }}
                  placeholder='0'
                  thousandSeparator=','
                  decimalSeparator='.'
                  decimalScale={2}
                  allowNegative={false}
                  allowLeadingZeros={false}
                  customInput={Input}
                  className='bg-white border-gray-300 pl-8 pr-12 text-right font-medium'
                />
                <span className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm'>
                  VNĐ
                </span>
              </div>
              {amount && parseFloat(amount) > 0 && (
                <div className='mt-2 p-2 bg-blue-50 rounded-md border border-blue-200'>
                  <p className='text-sm text-blue-700'>
                    <span className='font-medium'>Còn lại: </span>
                    <span className='font-bold'>
                      <NumericFormat
                        value={calculateBalance()}
                        displayType='text'
                        thousandSeparator=','
                        decimalScale={2}
                        fixedDecimalScale={false}
                        prefix='₫'
                        suffix=' VNĐ'
                      />
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Customer and Case Service */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <Label
                htmlFor='customer'
                className='text-gray-700 font-semibold mb-2 block'
              >
                Khách hàng
              </Label>
              <SelectSearch
                options={customersList.map((customer) => ({
                  value: customer.id,
                  label: `${customer.cus_firstName} ${customer.cus_lastName} (${customer.cus_code})`,
                }))}
                defaultValue={selectedCustomer}
                onValueChange={(value) => setSelectedCustomer(value)}
                placeholder='Chọn khách hàng'
                name='customer'
                id='customer'
              />
            </div>

            <div>
              <Label
                htmlFor='caseService'
                className='text-gray-700 font-semibold mb-2 block'
              >
                Hồ sơ vụ việc
              </Label>
              <SelectSearch
                options={caseServicesList.map((caseService) => ({
                  value: caseService.id,
                  label: `${caseService.case_code} - ${caseService.case_customer.cus_firstName} ${caseService.case_customer.cus_lastName}`,
                }))}
                defaultValue={selectedCaseService}
                onValueChange={(value) => setSelectedCaseService(value)}
                placeholder='Chọn hồ sơ vụ việc'
                name='caseService'
                id='caseService'
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Label
              // htmlFor='description'
              className='text-gray-700 font-semibold mb-2 block'
            >
              Mô tả
            </Label>

            <Hydrated>
              {() => (
                <TextEditor
                  isReady={isContentReady}
                  name='description'
                  value={description}
                  onChange={setDescription}
                  placeholder='Nhập mô tả chi tiết về giao dịch...'
                  className='min-h-[200px]'
                />
              )}
            </Hydrated>
          </div>
        </CardContent>

        <CardFooter>
          <div className='w-full flex justify-between items-center'>
            <Link
              to='/erp/transactions'
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
                {type === 'create' ? 'Tạo giao dịch' : 'Cập nhật giao dịch'}
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </fetcher.Form>
  );
}
