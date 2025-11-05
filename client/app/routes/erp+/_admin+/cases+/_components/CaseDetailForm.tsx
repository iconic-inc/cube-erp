import { toast } from 'react-toastify';
import { useEffect, useRef, useState } from 'react';
import { Link, useFetcher, useNavigate } from '@remix-run/react';

import { action } from '~/routes/erp+/_admin+/cases+/new';
import { format } from 'date-fns';
import { CASE_SERVICE } from '~/constants/caseService.constant';
import { ILoaderDataPromise } from '~/interfaces/app.interface';
import { IListResponse } from '~/interfaces/response.interface';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { IEmployee } from '~/interfaces/employee.interface';
import {
  ICaseService,
  CaseParticipant,
  CaseTax,
  InstallmentPlanItem,
  IncurredCost,
  IInstallmentCreate,
  IIncurredCostCreate,
} from '~/interfaces/case.interface';
import { Button } from '~/components/ui/button';
import {
  Save,
  ArrowLeft,
  User,
  CreditCard,
  Plus,
  Trash2,
  Calculator,
} from 'lucide-react';
import { DatePicker } from '~/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import TextEditor from '~/components/TextEditor';
import { ICustomer } from '~/interfaces/customer.interface';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import Defer from '~/components/Defer';
import CustomerBrief from './CustomerBrief';
import { useFetcherResponseHandler } from '~/hooks/useFetcherResponseHandler';
import { Separator } from '~/components/ui/separator';
import EmployeePicker from '~/components/EmployeePicker';
import NumericInput from '~/components/NumericInput';
import { SelectSearch } from '~/components/ui/SelectSearch';
import { TRANSACTION } from '~/constants/transaction.constant';

export default function CaseDetailForm({
  formId,
  type,
  casePromise,
  customerPromise,
}: {
  formId: string;
  type: 'create' | 'update';
  casePromise?: ILoaderDataPromise<ICaseService>;
  customerPromise?: ILoaderDataPromise<ICustomer>;
}) {
  const fetcher = useFetcher<typeof action>({ key: formId });

  const [code, setCode] = useState<string>('');
  const [participants, setParticipants] = useState<CaseParticipant[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [status, setStatus] =
    useState<keyof typeof CASE_SERVICE.STATUS>('open');

  // Pricing fields
  const [baseAmount, setBaseAmount] = useState<number>(0);
  const [discounts, setDiscounts] = useState<number>(0);
  const [addOns, setAddOns] = useState<number>(0);
  const [taxes, setTaxes] = useState<CaseTax[]>([]);

  // Installments
  const [installments, setInstallments] = useState<IInstallmentCreate[]>([]);

  // Incurred costs
  const [incurredCosts, setIncurredCosts] = useState<IIncurredCostCreate[]>([]);

  // Thêm state để theo dõi lỗi
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isChanged, setIsChanged] = useState(false);

  // Xử lý form submit
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation
    const validationErrors: Record<string, string> = {};

    if (!code.trim()) {
      validationErrors.code = 'Vui lòng nhập mã Hồ sơ vụ việc';
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

    // Add participants data
    formData.set('participants', JSON.stringify(participants));

    // Add pricing data
    formData.set(
      'pricing',
      JSON.stringify({
        baseAmount,
        discounts,
        addOns,
        taxes,
      }),
    );

    // Add participants data
    formData.set('participants', JSON.stringify(participants));

    // Add installments data
    formData.set('installments', JSON.stringify(installments));

    // Add incurred costs data
    formData.set('incurredCosts', JSON.stringify(incurredCosts));

    // Set the case status
    formData.set('status', String(status));

    if (endDate) {
      formData.set('endDate', format(endDate, 'yyyy-MM-dd'));
    } else {
      formData.set('endDate', '');
    }

    // Submit the form
    if (type === 'create') {
      fetcher.submit(formData, { method: 'POST' });
    } else if (type === 'update') {
      // Use PATCH for updates
      fetcher.submit(formData, { method: 'PUT' });
    }
  };

  useEffect(() => {
    // Check if any field has changed
    const hasChanged =
      code ||
      participants.length > 0 ||
      notes ||
      startDate ||
      endDate ||
      status ||
      baseAmount > 0 ||
      discounts !== 0 ||
      addOns !== 0 ||
      taxes.length > 0 ||
      installments.length > 0 ||
      incurredCosts.length > 0;

    setIsChanged(!!hasChanged);
  }, [
    code,
    participants,
    notes,
    startDate,
    endDate,
    status,
    baseAmount,
    discounts,
    addOns,
    taxes,
    participants,
    installments,
    incurredCosts,
  ]);

  useFetcherResponseHandler(fetcher);

  // false by default if type is 'update', true after resolve the casePromise
  const [isContentReady, setIsContentReady] = useState(type !== 'update');
  // Fetch and load case data when in edit mode
  useEffect(() => {
    if (type === 'update' && casePromise) {
      const loadCase = async () => {
        try {
          const caseData = await casePromise;

          if (caseData && 'id' in caseData) {
            setCode(caseData.case_code || '');
            setNotes(caseData.case_notes || '');
            setStatus(
              (caseData.case_status as keyof typeof CASE_SERVICE.STATUS) ||
                'OPEN',
            );

            // Load pricing data
            if (caseData.case_pricing) {
              setBaseAmount(caseData.case_pricing.baseAmount || 0);
              setDiscounts(caseData.case_pricing.discounts || 0);
              setAddOns(caseData.case_pricing.addOns || 0);
              setTaxes(caseData.case_pricing.taxes || []);
            }

            // Load participants data
            if (caseData.case_participants) {
              setParticipants(caseData.case_participants);
            }

            // Load installments data
            if (caseData.case_installments) {
              setInstallments(caseData.case_installments);
            }

            // Load incurred costs data
            if (caseData.case_incurredCosts) {
              setIncurredCosts(caseData.case_incurredCosts);
            }

            // Convert string dates to Date objects
            if (caseData.case_startDate) {
              setStartDate(new Date(caseData.case_startDate));
            }

            if (caseData.case_endDate) {
              setEndDate(new Date(caseData.case_endDate));
            }
          } else {
            console.error('Case data is not in the expected format:', caseData);
            toast.error('Không thể tải dữ liệu case. Vui lòng thử lại sau.');
          }
        } catch (error) {
          console.error('Error loading case data:', error);
          toast.error('Không thể tải dữ liệu case. Vui lòng thử lại sau.');
        }
      };

      loadCase().then(() => {
        setIsContentReady(true);
      });
    }
  }, [type, casePromise]);

  const [openEmployeePicker, setOpenEmployeePicker] = useState(false);

  return (
    <fetcher.Form
      id={formId}
      method={type === 'create' ? 'POST' : 'PUT'}
      onSubmit={handleSubmit}
    >
      <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200'>
        <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white py-4 sm:py-6 rounded-t-xl'>
          <CardTitle className='text-white text-xl sm:text-2xl lg:text-3xl font-bold truncate'>
            {code || 'Mã Hồ sơ vụ việc'}
          </CardTitle>
        </CardHeader>
        <CardContent className='p-4 sm:p-6 space-y-4 sm:space-y-6'>
          <Defer resolve={customerPromise}>
            {(customer) => <CustomerBrief customer={customer} />}
          </Defer>

          <div>
            <Label
              htmlFor='case_code'
              className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'
            >
              Mã Hồ sơ vụ việc <span className='text-red-500'>*</span>
            </Label>
            <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2'>
              <Input
                id='case_code'
                name='code'
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder='Ví dụ: HS123456'
                className='bg-white border-gray-300 text-sm sm:text-base'
              />
            </div>
            {errors.code && (
              <p className='text-red-500 text-sm sm:text-base mt-1'>
                {errors.code}
              </p>
            )}
          </div>

          {/* Start Date, End Date */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'>
            <div>
              <Label className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'>
                Trạng thái
              </Label>
              <Select
                value={status}
                name='status'
                onValueChange={(value) =>
                  setStatus(value as keyof typeof CASE_SERVICE.STATUS)
                }
              >
                <SelectTrigger className='text-sm sm:text-base'>
                  <SelectValue placeholder='Chọn trạng thái' />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(CASE_SERVICE.STATUS).map((status) => (
                    <SelectItem key={status} value={status}>
                      {
                        CASE_SERVICE.STATUS[
                          status as keyof typeof CASE_SERVICE.STATUS
                        ]
                      }
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label
                htmlFor='case_startDate'
                className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'
              >
                Ngày bắt đầu <span className='text-red-500'>*</span>
              </Label>

              <DatePicker
                id='case_startDate'
                name='startDate'
                initialDate={startDate}
                onChange={(date) => setStartDate(date)}
              />
            </div>

            <div>
              <Label
                htmlFor='case_endDate'
                className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'
              >
                Ngày kết thúc (Tùy chọn)
              </Label>
              <DatePicker
                id='case_endDate'
                initialDate={endDate}
                onChange={(date) => setEndDate(date)}
              />
            </div>
          </div>

          {/* Case Notes */}
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
              placeholder='Nhập ghi chú cho dịch vụ vụ việc này...'
            />
          </div>

          <Separator />

          {/* Pricing Section */}
          <div className='space-y-4'>
            <Label className='flex items-center gap-2 text-green-600 font-semibold text-sm sm:text-base'>
              <Calculator />
              Thông tin tài chính
            </Label>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              <div>
                <Label className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'>
                  Giá cơ bản <span className='text-red-500'>*</span>
                </Label>
                <NumericInput
                  value={baseAmount}
                  onValueChange={(value) => setBaseAmount(parseInt(value))}
                />
              </div>

              <div>
                <input
                  hidden
                  id='discounts'
                  type='number'
                  value={discounts}
                  onChange={(e) => setDiscounts(Number(e.target.value))}
                  placeholder='0'
                  className='bg-white border-gray-300'
                />
              </div>

              <div>
                <input
                  hidden
                  id='addOns'
                  type='number'
                  value={addOns}
                  onChange={(e) => setAddOns(Number(e.target.value))}
                  placeholder='0'
                  className='bg-white border-gray-300'
                />
              </div>
            </div>

            {/* Tax Section */}
            <div>
              <div className='flex justify-between items-center mb-2'>
                <Label className='text-gray-700 font-semibold text-sm'>
                  Thuế
                </Label>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() =>
                    setTaxes([
                      ...taxes,
                      { name: '', mode: 'PERCENT', value: 0, scope: 'ON_BASE' },
                    ])
                  }
                >
                  <Plus />
                  Thêm thuế
                </Button>
              </div>

              {taxes.map((tax, index) => (
                <div
                  key={index}
                  className='grid grid-cols-1 sm:grid-cols-4 gap-2 mb-2 p-2 border rounded'
                >
                  <Input
                    placeholder='Tên thuế'
                    value={tax.name}
                    onChange={(e) => {
                      const newTaxes = [...taxes];
                      newTaxes[index].name = e.target.value;
                      setTaxes(newTaxes);
                    }}
                  />
                  <Select
                    value={tax.mode}
                    onValueChange={(value) => {
                      const newTaxes = [...taxes];
                      newTaxes[index].mode = value as 'PERCENT' | 'FIXED';
                      setTaxes(newTaxes);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='PERCENT'>Phần trăm</SelectItem>
                      <SelectItem value='FIXED'>Cố định</SelectItem>
                    </SelectContent>
                  </Select>
                  {tax.mode === 'PERCENT' ? (
                    <Input
                      type='number'
                      placeholder='Giá trị'
                      value={tax.value}
                      onChange={(e) => {
                        const newTaxes = [...taxes];
                        newTaxes[index].value = Number(e.target.value);
                        setTaxes(newTaxes);
                      }}
                    />
                  ) : (
                    <NumericInput
                      value={tax.value}
                      onValueChange={(value) => {
                        const newTaxes = [...taxes];
                        newTaxes[index].value = Number(value);
                        setTaxes(newTaxes);
                      }}
                    />
                  )}
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      setTaxes(taxes.filter((_, i) => i !== index))
                    }
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Installments Section */}
          <div className='space-y-4'>
            <div className='flex justify-between items-center'>
              <Label className='flex items-center gap-2 text-blue-600 font-semibold text-sm sm:text-base'>
                <CreditCard />
                Kỳ thanh toán
              </Label>
              <Button
                type='button'
                variant='outline'
                onClick={() =>
                  setInstallments([
                    ...installments,
                    {
                      seq: installments.length + 1,
                      dueDate: new Date(),
                      amount: 0,
                      paidAmount: 0,
                      notes: '',
                    },
                  ])
                }
              >
                <Plus />
                Thêm kỳ thanh toán
              </Button>
            </div>

            {installments.map((installment, index) => (
              <div
                key={index}
                className='grid grid-cols-1 sm:grid-cols-5 gap-2 p-3 border rounded-lg bg-gray-50'
              >
                <div>
                  <Label className='text-xs font-medium'>Thứ tự</Label>
                  <Input
                    type='number'
                    value={installment.seq}
                    onChange={(e) => {
                      const newInstallments = [...installments];
                      newInstallments[index].seq = Number(e.target.value);
                      setInstallments(newInstallments);
                    }}
                    className='mt-1'
                  />
                </div>
                <div>
                  <Label className='text-xs font-medium'>Ngày đến hạn</Label>
                  <Input
                    type='date'
                    value={
                      new Date(installment.dueDate).toISOString().split('T')[0]
                    }
                    onChange={(e) => {
                      const newInstallments = [...installments];
                      newInstallments[index].dueDate = new Date(e.target.value);
                      setInstallments(newInstallments);
                    }}
                    className='mt-1'
                  />
                </div>
                <div>
                  <Label className='text-xs font-medium mb-1'>Số tiền</Label>
                  <NumericInput
                    value={installment.amount}
                    onValueChange={(value) => {
                      const newInstallments = [...installments];
                      newInstallments[index].amount = Number(value);
                      setInstallments(newInstallments);
                    }}
                  />
                </div>
                <div>
                  <Label className='text-xs font-medium'>Ghi chú</Label>
                  <Input
                    value={installment.notes || ''}
                    onChange={(e) => {
                      const newInstallments = [...installments];
                      newInstallments[index].notes = e.target.value;
                      setInstallments(newInstallments);
                    }}
                    className='mt-1'
                  />
                </div>
                <div className='flex items-end'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      setInstallments(
                        installments.filter((_, i) => i !== index),
                      )
                    }
                    className='w-full'
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Incurred Costs Section */}
          <div className='space-y-4'>
            <div className='flex justify-between items-center'>
              <Label className='flex items-center gap-2 text-orange-600 font-semibold text-sm sm:text-base'>
                <Calculator />
                Chi phí phát sinh
              </Label>
              <Button
                type='button'
                variant='outline'
                onClick={() =>
                  setIncurredCosts([
                    ...incurredCosts,
                    {
                      date: new Date(),
                      category: '',
                      description: '',
                      amount: 0,
                    },
                  ])
                }
              >
                <Plus />
                Thêm chi phí
              </Button>
            </div>

            {incurredCosts.map((cost, index) => (
              <div
                key={index}
                className='grid grid-cols-1 sm:grid-cols-5 gap-2 p-3 border rounded-lg bg-gray-50'
              >
                <div>
                  <Label className='text-xs font-medium'>Ngày</Label>
                  <Input
                    type='date'
                    value={new Date(cost.date).toISOString().split('T')[0]}
                    onChange={(e) => {
                      const newCosts = [...incurredCosts];
                      newCosts[index].date = new Date(e.target.value);
                      setIncurredCosts(newCosts);
                    }}
                    className='mt-1'
                  />
                </div>
                <div>
                  <Label className='text-xs font-medium'>Danh mục</Label>
                  <SelectSearch
                    id='category'
                    value={cost.category}
                    onValueChange={(value) => {
                      const newCosts = [...incurredCosts];
                      newCosts[index].category = value;
                      setIncurredCosts(newCosts);
                    }}
                    placeholder='Nhập loại chi phí...'
                    options={Object.values(TRANSACTION.CATEGORY.outcome)}
                  />
                </div>
                <div>
                  <Label className='text-xs font-medium'>Số tiền</Label>
                  <NumericInput
                    value={cost.amount}
                    onValueChange={(value) => {
                      const newCosts = [...incurredCosts];
                      newCosts[index].amount = Number(value);
                      setIncurredCosts(newCosts);
                    }}
                  />
                </div>
                <div>
                  <Label className='text-xs font-medium'>Mô tả</Label>
                  <Input
                    value={cost.description || ''}
                    onChange={(e) => {
                      const newCosts = [...incurredCosts];
                      newCosts[index].description = e.target.value;
                      setIncurredCosts(newCosts);
                    }}
                    className='mt-1'
                  />
                </div>
                <div className='flex items-end'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      setIncurredCosts(
                        incurredCosts.filter((_, i) => i !== index),
                      )
                    }
                    className='w-full'
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {type === 'create' && (
            <div className=''>
              <div className='flex justify-between items-center'>
                <Label
                  htmlFor='participants'
                  className='flex gap-2 text-teal-600 font-semibold block flex items-center text-sm sm:text-base'
                >
                  <User />
                  Người tham gia
                </Label>

                <Button
                  variant={'outline'}
                  type='button'
                  onClick={() => setOpenEmployeePicker(true)}
                >
                  <Plus />
                  Thêm nhân sự
                </Button>
              </div>

              {errors.participants && (
                <p className='text-red-500 text-sm sm:text-base mt-2 sm:mt-4'>
                  {errors.participants}
                </p>
              )}

              {openEmployeePicker && (
                <EmployeePicker
                  onClose={() => setOpenEmployeePicker(false)}
                  selected={
                    participants.map((p) => ({
                      id: p.employeeId,
                      emp_firstName: '',
                      emp_lastName: '',
                      emp_email: '',
                    })) as any[]
                  }
                  employeeGetter={async () => {
                    try {
                      const response = await fetch(
                        `/api/data?getter=getEmployees&limit=10000&page=1`,
                      );
                      const data: IListResponse<IEmployee> =
                        await response.json();

                      return data;
                    } catch (error) {
                      console.error('Error fetching documents:', error);
                      toast.error('Có lỗi xảy ra khi tải nhân viên');
                      return { data: [], pagination: {} as any };
                    }
                  }}
                  onSelect={(employees: IEmployee[]) => {
                    // Convert employees to participants with default commission
                    const newParticipants: CaseParticipant[] = employees.map(
                      (emp) => ({
                        employeeId: emp.id,
                        role: '',
                        commission: {
                          type: 'PERCENT_OF_GROSS',
                          value: 0,
                          eligibleOn: 'AT_CLOSURE',
                        },
                      }),
                    );
                    setParticipants(newParticipants);
                  }}
                />
              )}

              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-6'>
                {participants.map((participant, i) => (
                  <div key={i} className='p-3 border rounded-lg'>
                    <div className='text-sm font-medium'>
                      Participant ID: {participant.employeeId}
                    </div>
                    <div className='text-xs text-gray-500'>
                      Role: {participant.role || 'Not specified'}
                    </div>
                    <div className='text-xs text-gray-500'>
                      Commission: {participant.commission.value}% (
                      {participant.commission.type})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className='p-4 sm:p-6'>
          <div className='w-full flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0'>
            <Link
              to='/erp/customers'
              prefetch='intent'
              className='bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base flex items-center transition-all duration-300 w-full sm:w-auto justify-center'
            >
              <ArrowLeft className='h-4 w-4' />
              <span className='hidden sm:inline'>Trở về Danh sách</span>
              <span className='sm:hidden'>Trở về</span>
            </Link>

            <div className='flex space-x-2 w-full sm:w-auto'>
              <Button
                className=''
                type='submit'
                form={formId}
                disabled={!isChanged}
              >
                <Save className='h-4 w-4' />
                <span className='hidden sm:inline'>Lưu Hồ sơ</span>
                <span className='sm:hidden'>Lưu</span>
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </fetcher.Form>
  );
}
