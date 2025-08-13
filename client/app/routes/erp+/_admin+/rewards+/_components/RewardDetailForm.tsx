import { toast } from 'react-toastify';
import { useEffect, useRef, useState } from 'react';
import { Link, useFetcher, useNavigate } from '@remix-run/react';

import { action } from '~/routes/erp+/_admin+/rewards+/new';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Button } from '~/components/ui/button';
import { ArrowLeft, RotateCcw, Save } from 'lucide-react';
import { IReward, IRewardCreate } from '~/interfaces/reward.interface';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import LoadingCard from '~/components/LoadingCard';
import { NumericFormat } from 'react-number-format';
import { DatePicker } from '~/components/ui/date-picker';
import TextEditor from '~/components/TextEditor';

interface RewardDetailFormProps {
  formId: string;
  type: 'create' | 'update';
  rewardPromise?: Promise<IReward>;
  initialData?: Partial<IRewardCreate>;
}

export default function RewardDetailForm({
  formId,
  type,
  rewardPromise,
  initialData,
}: RewardDetailFormProps) {
  const fetcher = useFetcher<typeof action>({ key: formId });
  const toastIdRef = useRef<any>(null);
  const navigate = useNavigate();

  // Form state
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [currentAmount, setCurrentAmount] = useState<string>('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Control states
  const [reward, setReward] = useState<any | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isChanged, setIsChanged] = useState(false);
  const [isContentReady, setIsContentReady] = useState(type !== 'update');

  // Ensure numeric values for form submission
  const getNumericValue = (value: string): string => {
    return value.toString() || '0';
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation
    const validationErrors: Record<string, string> = {};

    if (!name.trim()) {
      validationErrors.name = 'Vui lòng nhập tên quỹ thưởng';
    }

    if (!currentAmount.trim() || parseFloat(currentAmount) <= 0) {
      validationErrors.currentAmount = 'Vui lòng nhập số tiền hợp lệ';
    }

    if (!startDate) {
      validationErrors.startDate = 'Vui lòng chọn ngày bắt đầu';
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
    formData.set('name', name);
    formData.set('description', description);
    formData.set('currentAmount', getNumericValue(currentAmount));

    // Format dates for submission
    if (startDate) {
      formData.set('startDate', startDate.toISOString().split('T')[0]);
    }

    if (endDate) {
      formData.set('endDate', endDate.toISOString().split('T')[0]);
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
      name ||
      description ||
      currentAmount ||
      startDate !== new Date() ||
      endDate !== null;

    setIsChanged(!!hasChanged);
  }, [name, description, currentAmount, startDate, endDate]);

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

  // Load reward data when in edit mode
  useEffect(() => {
    if (type === 'update' && rewardPromise) {
      const loadReward = async () => {
        try {
          const rewardData = await rewardPromise;

          if (rewardData && 'rw_name' in rewardData) {
            setReward(rewardData);
            setName(rewardData.rw_name || '');
            setDescription(rewardData.rw_description || '');
            setCurrentAmount(rewardData.rw_currentAmount?.toString() || '');

            if (rewardData.rw_startDate) {
              setStartDate(new Date(rewardData.rw_startDate));
            }

            if (rewardData.rw_endDate) {
              setEndDate(new Date(rewardData.rw_endDate));
            }
          } else {
            console.error(
              'Reward data is not in the expected format:',
              rewardData,
            );
            toast.error(
              'Không thể tải dữ liệu quỹ thưởng. Vui lòng thử lại sau.',
            );
          }
        } catch (error) {
          console.error('Error loading reward data:', error);
          toast.error(
            'Không thể tải dữ liệu quỹ thưởng. Vui lòng thử lại sau.',
          );
        }
      };

      loadReward().then(() => {
        setIsContentReady(true);
      });
    }

    // Initialize with data from props if available
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setCurrentAmount(initialData.currentAmount?.toString() || '');

      if (initialData.startDate) {
        setStartDate(new Date(initialData.startDate));
      }

      if (initialData.endDate) {
        setEndDate(new Date(initialData.endDate));
      }
    }
  }, [type, rewardPromise, initialData]);

  if (!isContentReady) {
    return <LoadingCard />;
  }

  return (
    <fetcher.Form
      id={formId}
      method={type === 'create' ? 'POST' : 'PUT'}
      onSubmit={handleSubmit}
      className='p-2 sm:p-0'
    >
      <Card className='rounded-lg sm:rounded-xl overflow-hidden shadow-md sm:shadow-lg border border-gray-200'>
        <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white py-4 sm:py-6 px-4 sm:px-6 rounded-t-lg sm:rounded-t-xl'>
          <CardTitle className='text-white text-lg sm:text-2xl lg:text-3xl font-bold break-words'>
            {name || 'Quỹ thưởng mới'}
          </CardTitle>
        </CardHeader>

        <CardContent className='p-4 sm:p-6 space-y-4 sm:space-y-6'>
          {/* Event Type and Amount */}
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6'>
            {/* Reward Name */}
            <div className='lg:col-span-8'>
              <Label
                htmlFor='name'
                className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'
              >
                Tên quỹ thưởng <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='name'
                name='name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='VD: Thưởng Tết Nguyên Đán 2025'
                className='bg-white border-gray-300 text-sm sm:text-base'
              />
              {errors.name && (
                <p className='text-red-500 text-xs sm:text-sm mt-1'>
                  {errors.name}
                </p>
              )}
            </div>

            <div className='lg:col-span-4'>
              <Label
                htmlFor='currentAmount'
                className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'
              >
                Số tiền ban đầu <span className='text-red-500'>*</span>
              </Label>
              <div className='relative'>
                <span className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs sm:text-sm z-10'>
                  ₫
                </span>
                <NumericFormat
                  id='currentAmount'
                  name='currentAmount'
                  value={currentAmount}
                  onValueChange={(values) => {
                    setCurrentAmount(values.value);
                  }}
                  placeholder='0'
                  thousandSeparator=','
                  decimalSeparator='.'
                  decimalScale={0}
                  allowNegative={false}
                  allowLeadingZeros={false}
                  customInput={Input}
                  className='bg-white border-gray-300 pl-8 pr-12 text-right font-medium text-sm sm:text-base'
                />
                <span className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs sm:text-sm'>
                  VNĐ
                </span>
              </div>
              {errors.currentAmount && (
                <p className='text-red-500 text-xs sm:text-sm mt-1'>
                  {errors.currentAmount}
                </p>
              )}
            </div>
          </div>

          {/* Date Range */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
            <div>
              <Label
                htmlFor='startDate'
                className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'
              >
                Ngày bắt đầu <span className='text-red-500'>*</span>
              </Label>
              <DatePicker
                id='startDate'
                initialDate={startDate}
                name='startDate'
                onChange={(date) => setStartDate(date)}
              />
              {errors.startDate && (
                <p className='text-red-500 text-xs sm:text-sm mt-1'>
                  {errors.startDate}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor='endDate'
                className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'
              >
                Ngày kết thúc (tùy chọn)
              </Label>
              <DatePicker
                id='endDate'
                initialDate={endDate}
                name='endDate'
                onChange={(date) => setEndDate(date)}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Label className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'>
              Mô tả
            </Label>

            <TextEditor
              isReady={isContentReady}
              name='description'
              value={description}
              onChange={setDescription}
              placeholder='Nhập mô tả chi tiết về quỹ thưởng...'
              className='min-h-[200px]'
            />
          </div>
        </CardContent>

        <CardFooter className='p-4 sm:p-6 pt-3 sm:pt-4 border-t border-gray-200'>
          <div className='w-full flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-0'>
            <Link
              to='/erp/rewards'
              className='bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm flex items-center justify-center transition-all duration-300 order-2 sm:order-1'
            >
              <ArrowLeft className='h-4 w-4' />
              <span className='hidden sm:inline'>Trở về Danh sách</span>
              <span className='sm:hidden'>Trở về</span>
            </Link>

            <div className='flex space-x-2 order-1 sm:order-2'>
              <Button
                className='bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow transform hover:-translate-y-0.5 flex-1 sm:flex-none'
                type='submit'
                form={formId}
                disabled={!isChanged}
              >
                <Save className='h-4 w-4' />
                <span className='hidden sm:inline'>
                  {type === 'create' ? 'Tạo quỹ thưởng' : 'Cập nhật quỹ thưởng'}
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
